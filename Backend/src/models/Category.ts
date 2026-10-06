import { Schema, model, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

export type CategoryDocument = InferSchemaType<typeof categorySchema> & { _id: unknown };
export const Category = model("Category", categorySchema);
