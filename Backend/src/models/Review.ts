import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 }
  },
  { timestamps: true }
);

reviewSchema.index({ reviewer: 1, seller: 1 }, { unique: true });

export const Review = model("Review", reviewSchema);
