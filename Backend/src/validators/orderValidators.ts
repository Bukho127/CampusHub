import { z } from "zod";

export const createOrderSchema = z.object({
  items: z.array(z.object({
    listingId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().min(1).max(100)
  })).min(1).max(50),
  paymentMethod: z.enum(["snapscan", "cash", "card", "eft", "other"])
}).superRefine(({ items }, context) => {
  if (new Set(items.map((item) => item.listingId)).size !== items.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Each listing can only appear once" });
  }
});
