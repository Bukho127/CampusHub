import { Schema, model } from "mongoose";

const communityPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: ["announcement", "event", "service"], required: true },
    dateLabel: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

communityPostSchema.index({ title: "text", summary: "text", body: "text" });

export const CommunityPost = model("CommunityPost", communityPostSchema);
