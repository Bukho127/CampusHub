import type { Request, Response } from "express";
import { CommunityPost } from "../models/CommunityPost";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

function vendorId(req: Request) {
  const id = req.user?.id;
  if (!id) throw new AppError("Authentication required", 401);
  return id;
}

export const getVendorProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(vendorId(req)).select("firstName lastName displayName email location avatar rating reviewCount vendorVerificationStatus createdAt").lean();
  if (!user) throw new AppError("Vendor account not found", 404);
  sendSuccess(res, { profile: user });
});

export const updateVendorProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    vendorId(req),
    { $set: { displayName: req.body.displayName, location: req.body.location } },
    { new: true, runValidators: true }
  ).select("firstName lastName displayName email location avatar rating reviewCount vendorVerificationStatus createdAt").lean();
  if (!user) throw new AppError("Vendor account not found", 404);
  sendSuccess(res, { profile: user }, "Vendor profile updated");
});

export const listVendorReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const filter = { seller: vendorId(req), moderationStatus: { $ne: "hidden" } };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("reviewer", "displayName avatar").populate("listing", "title").lean(),
    Review.countDocuments(filter)
  ]);
  sendSuccess(res, { reviews }, "Vendor reviews loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const listVendorPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const filter = { author: vendorId(req) };
  const [posts, total] = await Promise.all([
    CommunityPost.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CommunityPost.countDocuments(filter)
  ]);
  sendSuccess(res, { posts }, "Vendor community posts loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createVendorPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.create({ ...req.body, author: vendorId(req) });
  sendSuccess(res, { post }, "Community post created", 201);
});

export const updateVendorPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findOneAndUpdate(
    { _id: req.params.id, author: vendorId(req) },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!post) throw new AppError("Community post not found", 404);
  sendSuccess(res, { post }, "Community post updated");
});

export const deleteVendorPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findOneAndDelete({ _id: req.params.id, author: vendorId(req) });
  if (!post) throw new AppError("Community post not found", 404);
  sendSuccess(res, null, "Community post deleted");
});

export const getVendorEarnings = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const filter: Record<string, unknown> = { vendor: vendorId(req), paymentStatus: { $in: ["paid", "partially_refunded", "refunded"] } };
  if (req.query.from || req.query.to) {
    const createdAt: Record<string, Date> = {};
    if (req.query.from) createdAt.$gte = new Date(String(req.query.from));
    if (req.query.to) createdAt.$lte = new Date(String(req.query.to));
    filter.createdAt = createdAt;
  }
  const [orders, total, totals] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .select("amountCents refundedAmountCents currency status paymentStatus paymentMethod receiptNumber createdAt")
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ grossCents: number; refundedCents: number }>([
      { $match: filter },
      { $group: { _id: null, grossCents: { $sum: "$amountCents" }, refundedCents: { $sum: "$refundedAmountCents" } } }
    ])
  ]);
  const summary = totals[0] ?? { grossCents: 0, refundedCents: 0 };
  sendSuccess(res, {
    earnings: orders.map((order) => ({ ...order, netCents: order.amountCents - order.refundedAmountCents })),
    totals: { grossCents: summary.grossCents, refundedCents: summary.refundedCents, netCents: summary.grossCents - summary.refundedCents }
  }, "Vendor earnings loaded", 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
