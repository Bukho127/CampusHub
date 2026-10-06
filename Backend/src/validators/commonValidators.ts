import { z } from "zod";

export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")
});

export const optionalBooleanSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

export const optionalNumberSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  return Number(value);
}, z.number().optional());
