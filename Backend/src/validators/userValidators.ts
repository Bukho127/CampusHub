import { z } from "zod";

export const updateMeSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().max(120).optional(),
  avatar: z.string().trim().url().optional()
});
