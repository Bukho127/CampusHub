import { createHash, randomBytes } from "crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { Listing } from "../models/Listing";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { sendCampusVerificationEmail } from "../services/emailService";
import { fileToPublicUploadUrl } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

const publicSellerFields = "displayName identityType role emailVerificationStatus vendorVerificationStatus campusEmailVerificationStatus campusEmailVerifiedAt rating reviewCount location avatar createdAt";

export const getPublicUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select(publicSellerFields);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccess(res, { user });
});

export const getSeller = asyncHandler(async (req: Request, res: Response) => {
  const seller = await User.findById(req.params.id).select(publicSellerFields);

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }

  sendSuccess(res, { seller });
});

export const getSellerListings = asyncHandler(async (req: Request, res: Response) => {
  const seller = await User.findById(req.params.id).select("_id");

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }

  const listings = await Listing.find({ seller: seller._id, status: "active" }).sort({ createdAt: -1 });
  sendSuccess(res, { listings });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user?.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccess(res, { user }, "Profile updated");
});

export const updateMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("Choose an avatar image to upload", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { avatar: fileToPublicUploadUrl(req.file) },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccess(res, { user }, "Profile photo updated");
});

export const requestVendorVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.identityType = "vendor";
  if (user.vendorVerificationStatus === "unverified") {
    user.vendorVerificationStatus = "pending";
  }
  await user.save();

  sendSuccess(
    res,
    {
      vendorVerificationStatus: user.vendorVerificationStatus,
      role: user.role
    },
    "Vendor verification request recorded. Admin approval is required before vendor status is trusted."
  );
});

export const requestCampusEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.campusEmailVerifiedAt) {
    throw new AppError("Your campus email is already verified", 409);
  }

  const campusEmail = req.body.campusEmail as string;
  const allowedDomains = env.CAMPUS_EMAIL_DOMAINS.split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  if (!allowedDomains.some((domain) => campusEmail.endsWith(`@${domain}`))) {
    throw new AppError(`Use an approved campus email address (${allowedDomains.map((domain) => `@${domain}`).join(", ")})`, 400);
  }
  const existingVerification = await User.findOne({ campusEmail, campusEmailVerifiedAt: { $exists: true, $ne: null }, _id: { $ne: user._id } }).select("_id");
  if (existingVerification) {
    throw new AppError("This campus email is already verified on another account", 409);
  }

  const token = randomBytes(32).toString("hex");
  user.campusEmail = campusEmail;
  user.campusEmailVerificationStatus = "pending";
  user.campusEmailVerificationTokenHash = createHash("sha256").update(token).digest("hex");
  user.campusEmailVerificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const verificationUrl = `${env.APP_SCHEME}://verify-campus-email?token=${token}`;
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM);
  if (env.NODE_ENV !== "production" && !smtpConfigured) {
    console.info(`Campus email verification link for ${campusEmail}: ${verificationUrl}`);
  } else {
    try {
      await sendCampusVerificationEmail(campusEmail, verificationUrl);
    } catch (error) {
      user.campusEmailVerificationTokenHash = undefined;
      user.campusEmailVerificationExpiresAt = undefined;
      user.campusEmailVerificationStatus = "unverified";
      await user.save();
      console.error("Campus email verification could not be sent:", error);
      throw new AppError("Could not send the verification email. Try again later.", 503);
    }
  }

  sendSuccess(res, null, "If this campus email is eligible, a verification link has been sent.");
});
