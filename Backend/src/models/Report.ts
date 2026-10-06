import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" }
  },
  { timestamps: true }
);

reportSchema.index({ listing: 1, reporter: 1 });

export const Report = model("Report", reportSchema);
