import { Schema, model } from "mongoose";

const communityCommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 1200 }
  },
  { timestamps: true }
);

const communityImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    alt: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const communityPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: ["announcement", "event", "service"], required: true },
    dateLabel: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: communityImageSchema },
    likedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    comments: { type: [communityCommentSchema], default: [] }
  },
  { timestamps: true }
);

communityPostSchema.index({ title: "text", summary: "text", body: "text" });
communityPostSchema.index({ type: 1, createdAt: -1 });

export const CommunityPost = model("CommunityPost", communityPostSchema);
