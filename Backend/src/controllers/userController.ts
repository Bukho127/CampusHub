import type { Request, Response } from "express";
import { Types } from "mongoose";
import { rememberWithStatus, setCacheStatusHeader } from "../config/cache";
import { CommunityPost } from "../models/CommunityPost";
import { Favorite } from "../models/Favorite";
import { Listing } from "../models/Listing";
import { Review } from "../models/Review";
import { Report } from "../models/Report";
import { User } from "../models/User";
import { fileToPublicUploadUrl } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { cacheKey, invalidateCommunity, invalidateListings, invalidateReviews, invalidateSeller } from "../utils/cacheKeys";

const publicSellerFields = "displayName identityType role emailVerificationStatus emailVerified vendorVerificationStatus campusEmailVerificationStatus campusEmailVerifiedAt rating reviewCount location avatar createdAt";

async function refreshSellerRatings(sellerIds: string[]) {
  await Promise.all(
    [...new Set(sellerIds)].map(async (sellerId) => {
      const [aggregate] = await Review.aggregate([
        { $match: { seller: new Types.ObjectId(sellerId) } },
        { $group: { _id: "$seller", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
      ]);

      if (aggregate) {
        await User.updateOne(
          { _id: sellerId },
          {
            $set: {
              rating: Math.round(aggregate.rating * 10) / 10,
              reviewCount: aggregate.reviewCount
            }
          }
        );
        return;
      }

      await User.updateOne({ _id: sellerId }, { $unset: { rating: "" }, $set: { reviewCount: 0 } });
    })
  );
}

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

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const user = await User.findById(userId).select("_id");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const [listingIds, reviewedSellerIds] = await Promise.all([
    Listing.find({ seller: userId }).distinct("_id"),
    Review.find({ reviewer: userId }).distinct("seller")
  ]);

  await Promise.all([
    Favorite.deleteMany({ $or: [{ user: userId }, { listing: { $in: listingIds } }] }),
    Report.deleteMany({ $or: [{ reporter: userId }, { seller: userId }, { listing: { $in: listingIds } }] }),
    Review.deleteMany({ $or: [{ reviewer: userId }, { seller: userId }] }),
    Listing.deleteMany({ seller: userId }),
    CommunityPost.deleteMany({ author: userId }),
    CommunityPost.updateMany(
      {},
      {
        $pull: {
          likedBy: user._id,
          comments: { author: user._id }
        }
      }
    )
  ]);

  await User.deleteOne({ _id: user._id });
  await refreshSellerRatings(reviewedSellerIds.map(String).filter((sellerId) => sellerId !== userId));
  invalidateSeller(userId);
  invalidateListings();
  invalidateReviews(userId);
  invalidateCommunity();

  sendSuccess(res, null, "Account deleted");
});

export const requestVendorVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.identityType = "vendor";
  user.role = "vendor";
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
