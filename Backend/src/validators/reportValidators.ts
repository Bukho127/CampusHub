import { z } from "zod";

const reportFields = {
  reason: z.string().trim().min(3).max(140),
  details: z.string().trim().max(1200).optional()
};

export const createReportSchema = z.object(reportFields);
export const createSellerReportSchema = z.object(reportFields);
