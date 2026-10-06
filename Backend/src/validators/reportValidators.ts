import { z } from "zod";

export const createReportSchema = z.object({
  reason: z.string().trim().min(3).max(140),
  details: z.string().trim().max(1200).optional()
});
