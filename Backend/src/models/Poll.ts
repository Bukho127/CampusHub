import { Schema, model } from "mongoose";

const pollSchema = new Schema({
  question: { type: String, required: true, trim: true, maxlength: 240 },
  description: { type: String, trim: true, maxlength: 1200 },
  options: { type: [{ type: String, trim: true, maxlength: 120 }], required: true, validate: [(value: string[]) => value.length >= 2 && value.length <= 10, "Polls require between 2 and 10 options"] },
  status: { type: String, enum: ["draft", "open", "closed"], default: "draft", required: true },
  startsAt: { type: Date },
  endsAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

pollSchema.index({ status: 1, createdAt: -1 });
export const Poll = model("Poll", pollSchema);
