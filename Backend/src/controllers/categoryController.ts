import type { Request, Response } from "express";
import { rememberWithStatus, setCacheStatusHeader } from "../config/cache";
import { Category } from "../models/Category";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { cacheKey } from "../utils/cacheKeys";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("categories", "all"),
    60 * 60,
    async () => ({ categories: await Category.find().sort({ name: 1 }) })
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});
