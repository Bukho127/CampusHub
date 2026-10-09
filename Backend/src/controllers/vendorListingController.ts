import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const listVendorListings = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user?.id;
  if (!vendorId) throw new AppError("Authentication required", 401);

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const filter = {
    seller: vendorId,
    ...(typeof status === "string" ? { status } : {}),
    ...(query ? { title: { $regex: escapeRegex(query), $options: "i" } } : {})
  };

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Listing.countDocuments(filter)
  ]);

  sendSuccess(res, { listings }, "Vendor listings loaded", 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});
