import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  identityType: z.enum(["student", "faculty", "resident", "vendor"])
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128)
});

export const campusEmailVerificationSchema = z.object({
  campusEmail: z.string().trim().email().toLowerCase()
});

export const verifyCampusEmailSchema = z.object({
  token: z.string().min(32).max(256)
});
