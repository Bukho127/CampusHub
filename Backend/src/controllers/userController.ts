import type { Request, Response } from "express";
import { rememberWithStatus, setCacheStatusHeader } from "../config/cache";
import { Listing } from "../models/Listing";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { fileToPublicUploadUrl } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { cacheKey, invalidateSeller } from "../utils/cacheKeys";

const publicSellerFields = "displayName identityType role emailVerificationStatus emailVerified vendorVerificationStatus campusEmailVerificationStatus campusEmailVerifiedAt rating reviewCount location avatar createdAt";

export const getPublicUser = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("public-user", req.params.id),
    5 * 60,
    async () => {
      const user = await User.findById(req.params.id).select(publicSellerFields);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return { user };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});
export const getSeller = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("seller", req.params.id),
    2 * 60,
    async () => {
      const seller = await User.findById(req.params.id).select(publicSellerFields);

      if (!seller) {
        throw new AppError("Seller not found", 404);
      }

      return { seller };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});

export const getSellerListings = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("seller-listings", req.params.id),
    2 * 60,
    async () => {
      const seller = await User.findById(req.params.id).select("_id");

      if (!seller) {
        throw new AppError("Seller not found", 404);
      }

      const listings = await Listing.find({ seller: seller._id, status: "active" }).sort({ createdAt: -1 });
      return { listings };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user?.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  invalidateSeller(user._id.toString());
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

  invalidateSeller(user._id.toString());
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
