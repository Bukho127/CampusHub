import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { User } from "../models/User";
import { sendPasswordResetEmail } from "../services/emailService";
import { signAccessToken } from "../services/tokenService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

function publicUser(user: {
  _id: unknown;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  identityType: string;
  role: string;
  emailVerificationStatus: string;
  vendorVerificationStatus: string;
  campusEmailVerificationStatus?: string;
  campusEmailVerifiedAt?: Date | null;
  rating?: number | null;
  reviewCount: number;
  location?: string | null;
  avatar?: string | null;
}) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    email: user.email,
    identityType: user.identityType,
    role: user.role,
    emailVerificationStatus: user.emailVerificationStatus,
    vendorVerificationStatus: user.vendorVerificationStatus,
    campusEmailVerificationStatus: user.campusEmailVerificationStatus ?? "unverified",
    campusEmailVerified: Boolean(user.campusEmailVerifiedAt),
    rating: user.rating,
    reviewCount: user.reviewCount,
    location: user.location,
    avatar: user.avatar
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, identityType } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    email,
    passwordHash,
    identityType,
    role: "user",
    emailVerificationStatus: "pending",
    vendorVerificationStatus: identityType === "vendor" ? "pending" : "unverified"
  });

  const token = signAccessToken(user._id.toString(), user.role);
  sendSuccess(res, { user: publicUser(user), token }, "Registered", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signAccessToken(user._id.toString(), user.role);
  sendSuccess(res, { user: publicUser(user), token }, "Logged in");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccess(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, null, "Logged out. Discard the access token on the client.");
});

export const requestEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.emailVerificationStatus === "unverified") {
    user.emailVerificationStatus = "pending";
    await user.save();
  }

  sendSuccess(res, { emailVerificationStatus: user.emailVerificationStatus }, "Verification request recorded. Email delivery is a future integration.");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    user.passwordResetTokenHash = createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.APP_SCHEME}://reset-password?token=${resetToken}`;
    const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM);
    if (env.NODE_ENV !== "production" && !smtpConfigured) {
      console.info(`Password reset link for ${user.email}: ${resetUrl}`);
    } else {
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (error) {
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpiresAt = undefined;
        await user.save();
        console.error("Password reset email could not be sent:", error);
      }
    }
  }

  sendSuccess(res, null, "If an account exists for that email, password reset instructions have been sent.");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const tokenHash = createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select("+passwordResetTokenHash +passwordResetExpiresAt +passwordHash");

  if (!user) {
    throw new AppError("This password reset link is invalid or has expired", 400);
  }

  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  sendSuccess(res, null, "Password updated. You can now log in.");
});

export const verifyCampusEmail = asyncHandler(async (req: Request, res: Response) => {
  const tokenHash = createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({
    campusEmailVerificationTokenHash: tokenHash,
    campusEmailVerificationExpiresAt: { $gt: new Date() }
  }).select("+campusEmailVerificationTokenHash +campusEmailVerificationExpiresAt");

  if (!user) {
    throw new AppError("This campus verification link is invalid or has expired", 400);
  }

  user.campusEmailVerifiedAt = new Date();
  user.campusEmailVerificationStatus = "verified";
  user.campusEmailVerificationTokenHash = undefined;
  user.campusEmailVerificationExpiresAt = undefined;
  await user.save();

  sendSuccess(res, { campusEmailVerified: true }, "Campus email verified");
});
