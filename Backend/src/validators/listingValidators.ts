import { z } from "zod";
import { optionalBooleanSchema, optionalNumberSchema } from "./commonValidators";

const sortSchema = z.enum(["recommended", "newest", "priceLow", "priceHigh", "rating"]);
const conditionSchema = z.enum(["New", "Like New", "Good", "Fair"]);
const dietaryTagSchema = z.enum(["healthy", "vegan", "vegetarian", "halal"]);
const dietaryTagsSchema = z.preprocess(
  (value) => typeof value === "string" ? [value] : value,
  z.array(dietaryTagSchema).max(4).default([])
);

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
  dietaryTags: dietaryTagsSchema,
  quantityAvailable: z.coerce.number().int().min(0).optional(),
  serviceMode: z.literal("enquiry").optional(),
  location: z.string().trim().min(1).max(120),
  status: z.enum(["active", "sold", "draft"]).default("active"),
  negotiable: optionalBooleanSchema.default(false),
  tradeEnabled: optionalBooleanSchema.default(false)
});

export const createListingSchema = listingBaseSchema.superRefine((value, context) => {
  const isFood = value.category.toLowerCase().includes("food");

  if (value.type === "goods") {
    if (!value.condition && !isFood) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["condition"], message: "condition is required for non-food goods" });
    }
    if (value.quantityAvailable === undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantityAvailable"], message: "quantityAvailable is required for goods" });
    }
  }

  if (value.dietaryTags.length && (value.type !== "goods" || !isFood)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["dietaryTags"], message: "Dietary tags are only allowed on Food & Bev goods listings" });
  }
});

export const updateListingSchema = listingBaseSchema.partial();
