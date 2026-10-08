import type { Request, Response } from "express";
import { rememberWithStatus, setCacheStatusHeader } from "../config/cache";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { cacheKey, invalidateReviews } from "../utils/cacheKeys";

export const getSellerReviews = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("reviews", `seller:${req.params.id}`),
    2 * 60,
    async () => {
      const seller = await User.findById(req.params.id).select("_id");
      if (!seller) throw new AppError("Seller not found", 404);

      const reviews = await Review.find({ seller: seller._id })
        .populate("reviewer", "displayName")
        .sort({ createdAt: -1 })
        .limit(50);

      return { reviews };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});

export const createSellerReview = asyncHandler(async (req: Request, res: Response) => {
  const [seller, reviewer] = await Promise.all([
    User.findById(req.params.id).select("_id"),
    User.findById(req.user?.id).select("_id")
  ]);

  if (!seller) throw new AppError("Seller not found", 404);
  if (!reviewer) throw new AppError("Reviewer not found", 401);
  if (seller._id.equals(reviewer._id)) throw new AppError("You cannot review your own seller profile", 400);

  const existing = await Review.exists({ seller: seller._id, reviewer: reviewer._id });
  if (existing) throw new AppError("You have already reviewed this seller", 409);

  let review;
  try {
    review = await Review.create({
      seller: seller._id,
      reviewer: reviewer._id,
      rating: req.body.rating,
      comment: req.body.comment
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new AppError("You have already reviewed this seller", 409);
    }
    throw error;
  }

  const [aggregate] = await Review.aggregate([
    { $match: { seller: seller._id } },
    { $group: { _id: "$seller", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
  ]);

  await User.updateOne({ _id: seller._id }, {
    $set: {
      rating: Math.round((aggregate?.rating ?? 0) * 10) / 10,
      reviewCount: aggregate?.reviewCount ?? 0
    }
  });
  await review.populate("reviewer", "displayName");
  invalidateReviews(seller._id.toString());

  sendSuccess(res, { review }, "Review submitted", 201);
});
