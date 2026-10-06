import { Schema, model, Types, type InferSchemaType } from "mongoose";

const listingImageSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    alt: { type: String, default: "" }
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    type: { type: String, enum: ["goods", "service"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["ZAR"], default: "ZAR", required: true },
    condition: { type: String, enum: ["New", "Like New", "Good", "Fair"] },
    quantityAvailable: { type: Number, min: 0 },
    serviceMode: { type: String, enum: ["enquiry"] },
    images: { type: [listingImageSchema], default: [] },
    location: { type: String, required: true, trim: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerType: { type: String, enum: ["casual", "vendor"], required: true },
    status: { type: String, enum: ["active", "sold", "draft"], default: "active", required: true },
    negotiable: { type: Boolean, default: false },
    tradeEnabled: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", description: "text", location: "text", category: "text" });
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ seller: 1, status: 1 });

listingSchema.pre("validate", function validateListingType(next) {
  if (this.type === "goods") {
    if (!this.condition) return next(new Error("condition is required for goods listings"));
    if (this.quantityAvailable === undefined) return next(new Error("quantityAvailable is required for goods listings"));
    this.serviceMode = undefined;
  }

  if (this.type === "service") {
    this.condition = undefined;
    this.quantityAvailable = undefined;
    this.tradeEnabled = false;
    this.serviceMode = this.serviceMode ?? "enquiry";
  }

  next();
});

export type ListingDocument = InferSchemaType<typeof listingSchema> & { _id: Types.ObjectId };
export const Listing = model("Listing", listingSchema);
