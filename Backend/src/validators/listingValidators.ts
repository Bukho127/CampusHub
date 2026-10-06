import { z } from "zod";
import { optionalBooleanSchema, optionalNumberSchema } from "./commonValidators";

const sortSchema = z.enum(["recommended", "newest", "priceLow", "priceHigh", "rating"]);
const conditionSchema = z.enum(["New", "Like New", "Good", "Fair"]);

export const listingQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: optionalNumberSchema,
  maxPrice: optionalNumberSchema,
  condition: conditionSchema.optional(),
  location: z.string().trim().optional(),
  sellerType: z.enum(["casual", "vendor"]).optional(),
  minRating: optionalNumberSchema,
  sort: sortSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

const listingBaseSchema = z.object({
  type: z.enum(["goods", "service"]),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(3000),
  category: z.string().trim().min(1).max(80),
  priceCents: z.coerce.number().int().min(0),
  condition: conditionSchema.optional(),
  quantityAvailable: z.coerce.number().int().min(0).optional(),
  serviceMode: z.literal("enquiry").optional(),
  location: z.string().trim().min(1).max(120),
  status: z.enum(["active", "sold", "draft"]).default("active"),
  negotiable: optionalBooleanSchema.default(false),
  tradeEnabled: optionalBooleanSchema.default(false)
});

export const createListingSchema = listingBaseSchema.superRefine((value, context) => {
    if (value.type === "goods") {
      if (!value.condition && !value.category.toLowerCase().includes("food")) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["condition"], message: "condition is required for goods" });
      }
      if (value.quantityAvailable === undefined) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantityAvailable"], message: "quantityAvailable is required for goods" });
      }
    }
  });

export const updateListingSchema = listingBaseSchema.partial();
