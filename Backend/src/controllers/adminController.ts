import type { Request, Response } from "express";
import { User } from "../models/User";
import { Listing } from "../models/Listing";
import { Order } from "../models/Order";
import { Report } from "../models/Report";
import { AdminAuditLog } from "../models/AdminAuditLog";
import { CommunityPost } from "../models/CommunityPost";
import { Institution } from "../models/Institution";
import { Poll } from "../models/Poll";
import { PollVote } from "../models/PollVote";
import { Review } from "../models/Review";
import { connection } from "mongoose";
import { recordAdminAudit } from "../utils/adminAudit";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const updateUserVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }
  await recordAdminAudit(req, "user.verification.updated", "user", String(user._id), req.body);
  sendSuccess(res, { user }, "User verification updated");
});

export const getAdminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [users, vendors, pendingVendors, activeListings, openReports, orders, paidOrders] = await Promise.all([
    User.countDocuments({ status: { $ne: "deleted" } }),
    User.countDocuments({ role: "vendor", status: { $ne: "deleted" } }),
    User.countDocuments({ role: "vendor", vendorVerificationStatus: "pending", status: { $ne: "deleted" } }),
    Listing.countDocuments({ status: "active" }),
    Report.countDocuments({ status: "open" }),
    Order.countDocuments(),
    Order.aggregate<{ totalCents: number }>([
      { $match: { paymentStatus: { $in: ["paid", "partially_refunded", "refunded"] } } },
      { $group: { _id: null, totalCents: { $sum: "$amountCents" } } }
    ])
  ]);
  sendSuccess(res, { users, vendors, pendingVendors, activeListings, openReports, orders, grossPaidCents: paidOrders[0]?.totalCents ?? 0 });
});

export const listAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, role, status, page = 1, limit = 20 } = req.query as Record<string, string | number | undefined>;
  const filter: Record<string, unknown> = { status: status ?? { $ne: "deleted" } };
  if (role) filter.role = role;
  if (q) {
    const safeQuery = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { displayName: { $regex: safeQuery, $options: "i" } },
      { email: { $regex: safeQuery, $options: "i" } }
    ];
  }
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select("displayName firstName lastName email role status vendorVerificationStatus emailVerified createdAt").sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
    User.countDocuments(filter)
  ]);
  sendSuccess(res, { users }, "Users loaded", 200, { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) });
});

export const listAdminVendors = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query as Record<string, string | number | undefined>;
  const filter: Record<string, unknown> = { role: "vendor", status: { $ne: "deleted" } };
  if (status) filter.vendorVerificationStatus = status;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const [vendors, total] = await Promise.all([
    User.find(filter).select("displayName firstName lastName email vendorVerificationStatus emailVerified campusEmailVerificationStatus campusEmailVerifiedAt createdAt location").sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
    User.countDocuments(filter)
  ]);
  sendSuccess(res, { vendors }, "Vendor applications loaded", 200, { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) });
});

export const setAdminUserStatus = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user?.id) throw new AppError("You cannot change your own account status", 400);
  const target = await User.findById(req.params.id).select("role");
  if (!target) throw new AppError("User not found", 404);
  if (target.role === "admin") throw new AppError("Admin accounts cannot be banned from this screen", 403);
  const update = req.body.status === "banned"
    ? { $set: { status: "banned", banReason: req.body.banReason, ...(req.body.bannedUntil ? { bannedUntil: req.body.bannedUntil } : {}) }, $unset: req.body.bannedUntil ? {} : { bannedUntil: 1 }, $inc: { tokenVersion: 1 } }
    : { $set: { status: "active" }, $unset: { banReason: 1, bannedUntil: 1 }, $inc: { tokenVersion: 1 } };
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .select("displayName email role status banReason bannedUntil");
  if (!user) throw new AppError("User not found", 404);
  await recordAdminAudit(req, `user.${req.body.status}`, "user", String(user._id), { reason: req.body.banReason, bannedUntil: req.body.bannedUntil });
  sendSuccess(res, { user }, `User ${req.body.status === "banned" ? "banned" : "unbanned"}`);
});

export const deleteAdminUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user?.id) throw new AppError("You cannot delete your own account", 400);
  const target = await User.findById(req.params.id).select("role");
  if (!target) throw new AppError("User not found", 404);
  if (target.role === "admin") throw new AppError("Admin accounts cannot be deleted from this screen", 403);
  await User.findByIdAndUpdate(req.params.id, {
    $set: { status: "deleted", deletedAt: new Date() },
    $inc: { tokenVersion: 1 }
  });
  await recordAdminAudit(req, "user.deleted", "user", req.params.id);
  sendSuccess(res, null, "User deleted");
});

export const listAdminListings = asyncHandler(async (req: Request, res: Response) => {
  const { q, status, page = 1, limit = 20 } = req.query as Record<string, string | number | undefined>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    const safeQuery = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ title: { $regex: safeQuery, $options: "i" } }, { category: { $regex: safeQuery, $options: "i" } }];
  }
  const pageNumber = Number(page); const limitNumber = Number(limit);
  const [listings, total] = await Promise.all([
    Listing.find(filter).select("title description category priceCents discountPercent status seller createdAt").populate("seller", "displayName email role").sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
    Listing.countDocuments(filter)
  ]);
  sendSuccess(res, { listings }, "Listings loaded", 200, { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) });
});

export const setAdminListingStatus = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
  if (!listing) throw new AppError("Listing not found", 404);
  await recordAdminAudit(req, "listing.status.updated", "listing", String(listing._id), { status: req.body.status });
  sendSuccess(res, { listing }, "Listing moderation status updated");
});

export const listAdminReports = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query as Record<string, string | number | undefined>;
  const filter = status ? { status } : {};
  const pageNumber = Number(page); const limitNumber = Number(limit);
  const [reports, total] = await Promise.all([
    Report.find(filter).populate("reporter", "displayName email").populate("listing", "title status seller").populate("seller", "displayName email").sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
    Report.countDocuments(filter)
  ]);
  sendSuccess(res, { reports }, "Reports loaded", 200, { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) });
});

export const updateAdminReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
  if (!report) throw new AppError("Report not found", 404);
  await recordAdminAudit(req, "report.status.updated", "report", String(report._id), { status: req.body.status });
  sendSuccess(res, { report }, "Report updated");
});

export const listAdminAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const [logs, total] = await Promise.all([
    AdminAuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("actor", "displayName email").lean(),
    AdminAuditLog.countDocuments()
  ]);
  sendSuccess(res, { logs }, "Audit log loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const listAdminCommunityPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1); const limit = Number(req.query.limit ?? 20);
  const status = String(req.query.status ?? "active");
  const filter = status === "active" ? { moderationStatus: { $ne: "hidden" } } : { moderationStatus: "hidden" };
  const [posts, total] = await Promise.all([
    CommunityPost.find(filter).populate("author", "displayName email role").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CommunityPost.countDocuments(filter)
  ]);
  sendSuccess(res, { posts }, "Community posts loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const setAdminCommunityPostStatus = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $set: { moderationStatus: req.body.status } }, { new: true, runValidators: true });
  if (!post) throw new AppError("Community post not found", 404);
  await recordAdminAudit(req, "community_post.moderation.updated", "community_post", String(post._id), { status: req.body.status });
  sendSuccess(res, { post }, "Community post moderation status updated");
});

export const listAdminReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1); const limit = Number(req.query.limit ?? 20);
  const status = String(req.query.status ?? "active");
  const filter = status === "active" ? { moderationStatus: { $ne: "hidden" } } : { moderationStatus: "hidden" };
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate("reviewer", "displayName email").populate("seller", "displayName email").populate("listing", "title").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(filter)
  ]);
  sendSuccess(res, { reviews }, "Reviews loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const setAdminReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { moderationStatus: req.body.status } }, { new: true, runValidators: true });
  if (!review) throw new AppError("Review not found", 404);
  await recordAdminAudit(req, "review.moderation.updated", "review", String(review._id), { status: req.body.status });
  const [aggregate] = await Review.aggregate<{ rating: number; reviewCount: number }>([
    { $match: { seller: review.seller, moderationStatus: { $ne: "hidden" } } },
    { $group: { _id: "$seller", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
  ]);
  await User.updateOne({ _id: review.seller }, { $set: { rating: Math.round((aggregate?.rating ?? 0) * 10) / 10, reviewCount: aggregate?.reviewCount ?? 0 } });
  sendSuccess(res, { review }, "Review moderation status updated");
});

export const listAdminInstitutions = asyncHandler(async (_req: Request, res: Response) => {
  const institutions = await Institution.find().sort({ name: 1 }).lean();
  sendSuccess(res, { institutions });
});
export const createAdminInstitution = asyncHandler(async (req: Request, res: Response) => {
  const institution = await Institution.create(req.body);
  await recordAdminAudit(req, "institution.created", "institution", String(institution._id), { name: institution.name });
  sendSuccess(res, { institution }, "Institution created", 201);
});
export const updateAdminInstitution = asyncHandler(async (req: Request, res: Response) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!institution) throw new AppError("Institution not found", 404);
  await recordAdminAudit(req, "institution.updated", "institution", String(institution._id), req.body);
  sendSuccess(res, { institution }, "Institution updated");
});

export const listAdminPolls = asyncHandler(async (_req: Request, res: Response) => {
  const polls = await Poll.find().sort({ createdAt: -1 }).lean();
  const voteRows = await PollVote.aggregate([{ $group: { _id: { poll: "$poll", optionIndex: "$optionIndex" }, votes: { $sum: 1 } } }]);
  const counts = new Map(voteRows.map((row) => [`${row._id.poll}:${row._id.optionIndex}`, row.votes]));
  sendSuccess(res, { polls: polls.map((poll) => ({ ...poll, voteCounts: poll.options.map((_, index) => counts.get(`${poll._id}:${index}`) ?? 0), totalVotes: poll.options.reduce((sum, _, index) => sum + (counts.get(`${poll._id}:${index}`) ?? 0), 0) })) });
});
export const createAdminPoll = asyncHandler(async (req: Request, res: Response) => {
  const poll = await Poll.create({ ...req.body, createdBy: req.user?.id });
  await recordAdminAudit(req, "poll.created", "poll", String(poll._id), { question: poll.question });
  sendSuccess(res, { poll }, "Poll created", 201);
});
export const updateAdminPoll = asyncHandler(async (req: Request, res: Response) => {
  const current = await Poll.findById(req.params.id);
  if (!current) throw new AppError("Poll not found", 404);
  if (req.body.options && JSON.stringify(req.body.options) !== JSON.stringify(current.options)) {
    const votes = await PollVote.countDocuments({ poll: current._id });
    if (votes > 0) throw new AppError("Poll options cannot change after votes have been submitted", 409);
  }
  const poll = await Poll.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!poll) throw new AppError("Poll not found", 404);
  await recordAdminAudit(req, "poll.updated", "poll", String(poll._id), req.body);
  sendSuccess(res, { poll }, "Poll updated");
});
export const deleteAdminPoll = asyncHandler(async (req: Request, res: Response) => {
  const poll = await Poll.findByIdAndDelete(req.params.id);
  if (!poll) throw new AppError("Poll not found", 404);
  await PollVote.deleteMany({ poll: poll._id });
  await recordAdminAudit(req, "poll.deleted", "poll", String(poll._id), { question: poll.question });
  sendSuccess(res, null, "Poll deleted");
});

export const getAdminHealth = asyncHandler(async (_req: Request, res: Response) => {
  const readyState = connection.readyState;
  const memory = process.memoryUsage();
  sendSuccess(res, {
    status: readyState === 1 ? "healthy" : "degraded",
    database: readyState === 1 ? "connected" : readyState === 2 ? "connecting" : "disconnected",
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryBytes: { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal },
    checkedAt: new Date().toISOString()
  });
});

export const getAdminFraudAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const [reports, refundedOrders] = await Promise.all([
    Report.find({ status: "open" }).populate("listing", "title").populate("seller", "displayName").populate("reporter", "displayName").sort({ createdAt: -1 }).limit(500).lean(),
    Order.find({ refundedAmountCents: { $gt: 0 } }).select("buyer vendor amountCents refundedAmountCents createdAt paymentStatus").populate("buyer", "displayName email").populate("vendor", "displayName").sort({ createdAt: -1 }).limit(500).lean()
  ]);
  const groupedReports = new Map<string, typeof reports>();
  for (const report of reports) {
    const target = report.listing ? `listing:${report.listing.toString()}` : `seller:${report.seller?.toString() ?? "unknown"}`;
    groupedReports.set(target, [...(groupedReports.get(target) ?? []), report]);
  }
  const alerts: Array<Record<string, unknown>> = [];
  for (const [target, group] of groupedReports) if (group.length >= 2) {
    const first = group[0];
    const listing = first?.listing as unknown as { title?: string } | null;
    const seller = first?.seller as unknown as { displayName?: string } | null;
    alerts.push({ type: "multiple_reports", severity: group.length >= 4 ? "high" : "medium", target, count: group.length, subject: listing?.title ?? seller?.displayName ?? target, message: `${group.length} open reports reference the same ${target.split(":")[0]}.`, createdAt: first?.createdAt });
  }
  const refundCounts = new Map<string, { count: number; amountCents: number; buyer: unknown }>();
  for (const order of refundedOrders) {
    const buyer = typeof order.buyer === "object" ? order.buyer : null;
    const buyerId = String(buyer && "_id" in buyer ? buyer._id : order.buyer);
    const previous = refundCounts.get(buyerId) ?? { count: 0, amountCents: 0, buyer };
    refundCounts.set(buyerId, { count: previous.count + 1, amountCents: previous.amountCents + order.refundedAmountCents, buyer });
  }
  for (const [buyerId, summary] of refundCounts) if (summary.count >= 3 || summary.amountCents >= 100000) alerts.push({ type: "refund_pattern", severity: summary.count >= 5 || summary.amountCents >= 250000 ? "high" : "medium", target: `buyer:${buyerId}`, count: summary.count, amountCents: summary.amountCents, subject: summary.buyer && typeof summary.buyer === "object" && "displayName" in summary.buyer ? summary.buyer.displayName : buyerId, message: `${summary.count} refunded orders totalling ${(summary.amountCents / 100).toFixed(2)} ZAR matched a review rule.` });
  sendSuccess(res, { alerts: alerts.sort((a, b) => String(b.severity).localeCompare(String(a.severity))), generatedAt: new Date().toISOString(), source: "Heuristic review rules" });
});

export const listAdminPromotions = asyncHandler(async (_req: Request, res: Response) => {
  const listings = await Listing.find({ status: "active", discountPercent: { $gt: 0 } }).select("title category priceCents discountPercent seller updatedAt").populate("seller", "displayName email").sort({ updatedAt: -1 }).limit(200).lean();
  sendSuccess(res, { promotions: listings });
});

export const updateAdminPromotion = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findOneAndUpdate({ _id: req.params.id, status: "active" }, { $set: { discountPercent: req.body.discountPercent } }, { new: true, runValidators: true });
  if (!listing) throw new AppError("Active listing not found", 404);
  await recordAdminAudit(req, "promotion.discount.updated", "listing", String(listing._id), { discountPercent: listing.discountPercent });
  sendSuccess(res, { promotion: listing }, "Promotion updated");
});

export const getAdminSettingsSummary = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    settings: [
      { name: "Dashboard authentication", value: "HttpOnly, same-site cookie" },
      { name: "Sensitive admin actions", value: "Password step-up required; token valid for 5 minutes" },
      { name: "Login lockout", value: "5 failed attempts within 15 minutes" },
      { name: "Payment processing", value: "Simulation only; no real payment gateway connected" },
      { name: "Vendor discount cap", value: "90%" },
      { name: "Authenticator app (TOTP)", value: "Not configured" },
      { name: "Runtime environment", value: process.env.NODE_ENV ?? "development" }
    ],
    management: "Runtime secrets and environment settings are managed in the backend deployment configuration."
  });
});
