import { z } from "zod";

export const createCommunityPostSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(240),
  body: z.string().trim().min(10).max(4000),
  type: z.enum(["announcement", "event", "service"]),
  dateLabel: z.string().trim().min(1).max(80),
  eventDate: z.string().trim().max(40).optional(),
  eventTime: z.string().trim().max(40).optional(),
  venue: z.string().trim().max(160).optional()
}).superRefine((value, context) => {
  if (value.type !== "event") return;

  for (const field of ["eventDate", "eventTime", "venue"] as const) {
    if (!value[field]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} is required for event posts`
      });
    }
  }
});

export const createCommunityCommentSchema = z.object({
  body: z.string().trim().min(1).max(1200)
});
