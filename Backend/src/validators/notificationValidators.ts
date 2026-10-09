import { z } from "zod";

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid listing id");

export const serviceRequestSchema = z.object({
  listingId: mongoIdSchema,
  note: z.string().trim().min(3).max(1200),
  preferredTime: z.string().trim().min(1).max(120)
});

export const orderCompletedSchema = z.object({
  items: z.array(z.object({
    listingId: mongoIdSchema,
    quantity: z.coerce.number().int().positive().max(99)
  })).min(1),
  paymentMethod: z.string().trim().min(1).max(80)
});

export const serviceCompletedSchema = z.object({
  listingId: mongoIdSchema,
  customerEmail: z.string().trim().email().optional(),
  customerName: z.string().trim().min(1).max(120).optional(),
  completedAt: z.string().trim().min(1).max(120).optional()
});
