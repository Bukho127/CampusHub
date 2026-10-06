import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { User } from "../models/User";
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

export const forgotPassword = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, null, "If that email exists, a reset flow will be sent when email delivery is integrated.");
});
