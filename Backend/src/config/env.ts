import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  APP_BASE_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  UPLOAD_DIR: z.string().default("src/uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5)
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production") {
    for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_FROM"] as const) {
      if (!values[key]) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required in production` });
      }
    }
    if (!values.SMTP_PASS && !values.SMTP_PASSWORD) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_PASS"], message: "SMTP_PASS is required in production" });
    }
    if (!values.APP_BASE_URL) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_BASE_URL"], message: "APP_BASE_URL is required in production" });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;
