import type { Request, Response } from "express";
import { flushCache, getCacheStats } from "../config/cache";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { invalidateListings, invalidateSeller, resetCacheVersions } from "../utils/cacheKeys";

export const updateUserVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  invalidateSeller(user._id.toString());
  invalidateListings(undefined, user._id.toString());
  sendSuccess(res, { user }, "User verification updated");
});

export const getAdminCacheStats = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { cache: await getCacheStats() });
});

export const flushAdminCache = asyncHandler(async (_req: Request, res: Response) => {
  await flushCache();
  resetCacheVersions();
  sendSuccess(res, { cache: await getCacheStats() }, "Cache flushed");
});
