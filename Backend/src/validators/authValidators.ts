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
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128).optional()
}).superRefine((value, context) => {
  if (value.confirmPassword !== undefined && value.password !== value.confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords do not match" });
  }
});

export const verifySchoolEmailRequestSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  studentNumber: z.string().trim().max(80).optional()
});

export const verifySchoolEmailCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code")
});
