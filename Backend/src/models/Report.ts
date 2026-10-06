import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    seller: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" }
  },
  { timestamps: true }
);

reportSchema.index({ listing: 1, reporter: 1 });
reportSchema.index({ seller: 1, reporter: 1 });

reportSchema.pre("validate", function validateTarget(next) {
  if (Boolean(this.listing) === Boolean(this.seller)) {
    return next(new Error("A report must target exactly one listing or seller"));
  }
  next();
});

export const Report = model("Report", reportSchema);
