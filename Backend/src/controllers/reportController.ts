import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { Report } from "../models/Report";
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
