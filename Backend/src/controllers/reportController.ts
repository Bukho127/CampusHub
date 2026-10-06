import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { Report } from "../models/Report";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const reportListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  const report = await Report.create({
    reporter: req.user?.id,
    listing: listing._id,
    reason: req.body.reason,
    details: req.body.details
  });

  sendSuccess(res, { report }, "Report submitted", 201);
});

export const reportSeller = asyncHandler(async (req: Request, res: Response) => {
  const seller = await User.findById(req.params.id).select("_id");

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }
  if (seller._id.toString() === req.user?.id) {
    throw new AppError("You cannot report your own seller profile", 400);
  }

  const report = await Report.create({
    reporter: req.user?.id,
    seller: seller._id,
    reason: req.body.reason,
    details: req.body.details
  });

  sendSuccess(res, { report }, "Seller report submitted", 201);
});
