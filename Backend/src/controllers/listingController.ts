import type { Request, Response } from "express";
import type { FilterQuery } from "mongoose";
import { rememberWithStatus, setCacheStatusHeader } from "../config/cache";
import { Listing, type ListingDocument } from "../models/Listing";
import { User } from "../models/User";
import { filesToStoredImages } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { cacheKey, invalidateListings, queryCacheKey } from "../utils/cacheKeys";

const sellerPopulate = "displayName identityType role emailVerificationStatus emailVerified vendorVerificationStatus campusEmailVerificationStatus campusEmailVerifiedAt rating reviewCount location avatar";
type ListingsCacheValue = {
  listings: unknown;
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function getUploadedFiles(req: Request) {
  return Array.isArray(req.files) ? req.files : undefined;
}

function assertOwnerOrAdmin(listing: ListingDocument, userId: string, role: string) {
  if (role === "admin") return;
  if (listing.seller.toString() !== userId) {
    throw new AppError("Only the listing owner can perform this action", 403);
  }
}

export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus<ListingsCacheValue>(
    queryCacheKey("listings", req.query as Record<string, unknown>),
    60,
    async () => {
      const {
        q,
        category,
        minPrice,
        maxPrice,
        condition,
        location,
        sellerType,
        minRating,
        sort = "recommended",
        page = 1,
        limit = 20
      } = req.query as Record<string, string | number | undefined>;

      const filter: FilterQuery<ListingDocument> = { status: "active" };

      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } }
        ];
      }

      if (category && category !== "all") filter.category = category;
      if (condition) filter.condition = condition;
      if (location) filter.location = { $regex: location, $options: "i" };
      if (sellerType) filter.sellerType = sellerType;
      if (minRating !== undefined) filter.rating = { $gte: Number(minRating) };
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.priceCents = {};
        if (minPrice !== undefined) filter.priceCents.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.priceCents.$lte = Number(maxPrice);
      }

      const sortMap = {
        newest: { createdAt: -1 },
        priceLow: { priceCents: 1 },
        priceHigh: { priceCents: -1 },
        rating: { rating: -1, reviewCount: -1 },
        recommended: { rating: -1, createdAt: -1 }
      } as const;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const skip = (pageNumber - 1) * limitNumber;

      const [items, total] = await Promise.all([
        Listing.find(filter).populate("seller", sellerPopulate).sort(sortMap[sort as keyof typeof sortMap]).skip(skip).limit(limitNumber),
        Listing.countDocuments(filter)
      ]);

      return {
        listings: items,
        meta: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber)
        }
      };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, { listings: cacheResult.value.listings }, "Listings loaded", 200, cacheResult.value.meta);
});

export const getListing = asyncHandler(async (req: Request, res: Response) => {
  const cacheResult = await rememberWithStatus(
    cacheKey("listing", req.params.id),
    60,
    async () => {
      const listing = await Listing.findById(req.params.id).populate("seller", sellerPopulate);

      if (!listing || listing.status === "draft") {
        throw new AppError("Listing not found", 404);
      }

      return { listing };
    }
  );

  setCacheStatusHeader(res, cacheResult.status);
  sendSuccess(res, cacheResult.value);
});

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const seller = await User.findById(req.user?.id);

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }

  const sellerType = seller.role === "vendor" && seller.vendorVerificationStatus === "verified" ? "vendor" : "casual";
  const images = filesToStoredImages(getUploadedFiles(req), req.body.title);

  const listing = await Listing.create({
    ...req.body,
    images,
    seller: seller._id,
    sellerType
  });

  await listing.populate("seller", sellerPopulate);
  invalidateListings(listing._id.toString(), seller._id.toString());
  sendSuccess(res, { listing }, "Listing created", 201);
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  assertOwnerOrAdmin(listing, req.user?.id ?? "", req.user?.role ?? "user");
  const sellerId = listing.seller.toString();

  const images = filesToStoredImages(getUploadedFiles(req), req.body.title ?? listing.title);
  Object.assign(listing, req.body);
  if (images.length) listing.images.push(...images);

  await listing.save();
  await listing.populate("seller", sellerPopulate);
  invalidateListings(listing._id.toString(), sellerId);

  sendSuccess(res, { listing }, "Listing updated");
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  assertOwnerOrAdmin(listing, req.user?.id ?? "", req.user?.role ?? "user");
  const sellerId = listing.seller.toString();
  await listing.deleteOne();
  invalidateListings(listing._id.toString(), sellerId);

  sendSuccess(res, null, "Listing deleted");
});

export const markSold = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  assertOwnerOrAdmin(listing, req.user?.id ?? "", req.user?.role ?? "user");
  const sellerId = listing.seller.toString();
  listing.status = "sold";
  if (listing.type === "goods") listing.quantityAvailable = 0;
  await listing.save();
  invalidateListings(listing._id.toString(), sellerId);

  sendSuccess(res, { listing }, "Listing marked as sold");
});
