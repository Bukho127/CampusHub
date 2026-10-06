import { z } from "zod";

export const createCommunityPostSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(240),
  body: z.string().trim().min(10).max(4000),
  type: z.enum(["announcement", "event", "service"]),
  dateLabel: z.string().trim().min(1).max(80)
});
