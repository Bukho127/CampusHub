import { z } from "zod";

export const verificationUpdateSchema = z.object({
  emailVerificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
  vendorVerificationStatus: z.enum(["unverified", "pending", "verified"]).optional(),
  role: z.enum(["user", "vendor", "admin"]).optional()
});
