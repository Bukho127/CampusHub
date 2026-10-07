import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { fileToPublicUploadUrl } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

const publicSellerFields = "displayName identityType role emailVerificationStatus emailVerified vendorVerificationStatus campusEmailVerificationStatus campusEmailVerifiedAt rating reviewCount location avatar createdAt";

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
