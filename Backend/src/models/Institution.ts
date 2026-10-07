import { Schema, model, type InferSchemaType } from "mongoose";

const institutionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    domains: { type: [String], required: true, default: [] },
    active: { type: Boolean, default: true, required: true }
  },
  { timestamps: true }
);

institutionSchema.index({ active: 1 });

export type InstitutionDocument = InferSchemaType<typeof institutionSchema>;
export const Institution = model("Institution", institutionSchema);