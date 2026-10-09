import { z } from "zod";

export const vendorSalesQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear())
});

export const vendorRevenueTrendQuerySchema = z.object({
  interval: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["from"],
      message: "The start date must be before the end date"
    });
  }
});

export const vendorOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "confirmed", "processing", "ready", "completed", "cancelled", "refunded"]).optional()
});

export const vendorListingQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["active", "sold", "draft"]).optional()
});

export const vendorPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const vendorProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  location: z.string().trim().max(160).optional().default("")
});

export const vendorEarningsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "The start date must be before the end date" });
  }
});
