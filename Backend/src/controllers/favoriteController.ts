import type { Request, Response } from "express";
import { Favorite } from "../models/Favorite";
import { Listing } from "../models/Listing";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await Favorite.find({ user: req.user?.id }).populate({
    path: "listing",
    match: { status: "active" },
    populate: { path: "seller", select: "displayName rating reviewCount location vendorVerificationStatus" }
  });

  sendSuccess(res, { favorites });
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing || listing.status !== "active") {
    throw new AppError("Listing not found", 404);
  }

  await Favorite.updateOne({ user: req.user?.id, listing: listing._id }, { user: req.user?.id, listing: listing._id }, { upsert: true });
  sendSuccess(res, null, "Favorite added", 201);
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  await Favorite.deleteOne({ user: req.user?.id, listing: req.params.id });
  sendSuccess(res, null, "Favorite removed");
});
