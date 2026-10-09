import { z } from "zod";

export const verificationUpdateSchema = z.object({
  emailVerificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
  vendorVerificationStatus: z.enum(["unverified", "pending", "verified"]).optional()
}).refine((value) => Object.keys(value).length > 0, { message: "At least one verification field is required" });

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["user", "vendor", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "banned"]),
  banReason: z.string().trim().min(3).max(500).optional(),
  bannedUntil: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (value.status === "banned" && !value.banReason) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["banReason"], message: "A reason is required when banning an account" });
  }
  if (value.status === "banned" && value.bannedUntil && value.bannedUntil <= new Date()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["bannedUntil"], message: "Ban expiry must be in the future" });
  }
});

export const adminVendorListQuerySchema = z.object({
  status: z.enum(["unverified", "pending", "verified"]).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const adminListingListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["active", "sold", "draft"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminListingStatusSchema = z.object({ status: z.enum(["active", "sold", "draft"]) });
export const adminReportListQuerySchema = z.object({
  status: z.enum(["open", "reviewed", "dismissed"]).default("open"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminReportStatusSchema = z.object({ status: z.enum(["reviewed", "dismissed"]) });
export const adminOrderListQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "ready", "completed", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  escrowStatus: z.enum(["not_applicable", "held", "released", "refunded"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminRefundSchema = z.object({ note: z.string().trim().max(500).optional() });
export const adminAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminCommunityPostQuerySchema = z.object({
  status: z.enum(["active", "hidden"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminCommunityPostStatusSchema = z.object({ status: z.enum(["active", "hidden"]) });
export const adminInstitutionSchema = z.object({
  name: z.string().trim().min(2).max(160),
  domains: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).max(30),
  active: z.boolean().default(true)
});
export const adminInstitutionUpdateSchema = adminInstitutionSchema.partial();
const adminPollBaseSchema = z.object({
  question: z.string().trim().min(5).max(240),
  description: z.string().trim().max(1200).optional(),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
  status: z.enum(["draft", "open", "closed"]).default("draft"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional()
});
export const adminPollSchema = adminPollBaseSchema.superRefine((value, context) => {
  if (new Set(value.options.map((item) => item.toLowerCase())).size !== value.options.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Poll options must be unique" });
  }
  if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Poll end must be after its start" });
  }
});
export const adminPollUpdateSchema = adminPollBaseSchema.partial().superRefine((value, context) => {
  if (value.options && new Set(value.options.map((item) => item.toLowerCase())).size !== value.options.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Poll options must be unique" });
  }
  if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Poll end must be after its start" });
  }
});
export const adminPromotionSchema = z.object({ discountPercent: z.coerce.number().int().min(0).max(90) });
export const adminReviewQuerySchema = z.object({
  status: z.enum(["active", "hidden"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const adminReviewStatusSchema = z.object({ status: z.enum(["active", "hidden"]) });
