import { Schema, model } from "mongoose";

const pollVoteSchema = new Schema({
  poll: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  optionIndex: { type: Number, required: true, min: 0 }
}, { timestamps: true });

pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
export const PollVote = model("PollVote", pollVoteSchema);
