import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { User } from "../models/User";
import {
  sendOrderReceiptEmail,
  sendSellerOrderEmail,
  sendServiceCompletedEmail,
  sendServiceRequestConfirmationEmail,
  sendServiceRequestEmail
} from "../services/emailService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { invalidateListings } from "../utils/cacheKeys";

type OrderItem = {
  listingId: string;
  quantity: number;
};

function displayName(user: { displayName?: string; firstName?: string; lastName?: string; email?: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "CampusHub user";
}

function readableDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

async function currentUser(userId: string | undefined) {
  if (!userId) throw new AppError("Authentication required", 401);
  const user = await User.findById(userId).select("displayName firstName lastName email");
  if (!user) throw new AppError("User not found", 404);
  return user;
}

export const sendServiceRequestNotification = asyncHandler(async (req: Request, res: Response) => {
  const requester = await currentUser(req.user?.id);
  const listing = await Listing.findById(req.body.listingId);

  if (!listing || listing.status !== "active") {
    throw new AppError("Listing not found", 404);
  }

  if (listing.type !== "service") {
    throw new AppError("Only service listings can receive service requests", 400);
  }

  if (listing.seller.toString() === requester._id.toString()) {
    throw new AppError("You cannot request your own service", 400);
  }

  const seller = await User.findById(listing.seller).select("displayName firstName lastName email");
  if (!seller) throw new AppError("Seller not found", 404);

  const details = {
    listingTitle: listing.title,
    requesterEmail: requester.email,
    requesterName: displayName(requester),
    sellerName: displayName(seller),
    note: req.body.note,
    preferredTime: readableDateTime(req.body.preferredTime)
  };

  try {
    await Promise.all([
      sendServiceRequestEmail(seller.email, details),
      sendServiceRequestConfirmationEmail(requester.email, details)
    ]);
  } catch {
    throw new AppError("Unable to send service request email right now. Please try again later.", 503);
  }

  sendSuccess(res, null, "Service request email sent");
});

export const sendOrderCompletedNotification = asyncHandler(async (req: Request, res: Response) => {
  const buyer = await currentUser(req.user?.id);
  const items = req.body.items as OrderItem[];
  const requestedQuantityById = new Map<string, number>();

  for (const item of items) {
    requestedQuantityById.set(item.listingId, (requestedQuantityById.get(item.listingId) ?? 0) + item.quantity);
  }

  const listings = await Listing.find({ _id: { $in: Array.from(requestedQuantityById.keys()) } });
  if (listings.length !== requestedQuantityById.size) {
    throw new AppError("One or more listings could not be found", 404);
  }

  for (const listing of listings) {
    const quantity = requestedQuantityById.get(listing._id.toString()) ?? 0;
    if (listing.type !== "goods") throw new AppError("Only goods listings can be purchased at checkout", 400);
    if (listing.status !== "active") throw new AppError(`${listing.title} is no longer available`, 409);
    if ((listing.quantityAvailable ?? 0) < quantity) throw new AppError(`${listing.title} does not have enough stock available`, 409);
  }

  const sellerIds = [...new Set(listings.map((listing) => listing.seller.toString()))];
  const sellers = await User.find({ _id: { $in: sellerIds } }).select("displayName firstName lastName email");
  const sellersById = new Map(sellers.map((seller) => [seller._id.toString(), seller]));

  const buyerItems = listings.map((listing) => {
    const quantity = requestedQuantityById.get(listing._id.toString()) ?? 0;
    return {
      title: listing.title,
      quantity,
      lineTotalCents: listing.priceCents * quantity
    };
  });
  const totalCents = buyerItems.reduce((total, item) => total + item.lineTotalCents, 0);

  for (const listing of listings) {
    const quantity = requestedQuantityById.get(listing._id.toString()) ?? 0;
    listing.quantityAvailable = Math.max(0, (listing.quantityAvailable ?? 0) - quantity);
    if (listing.quantityAvailable === 0) listing.status = "sold";
    await listing.save();
    invalidateListings(listing._id.toString(), listing.seller.toString());
  }

  try {
    await sendOrderReceiptEmail(buyer.email, {
      buyerName: displayName(buyer),
      items: buyerItems,
      paymentMethod: req.body.paymentMethod,
      totalCents
    });

    await Promise.all(sellerIds.map(async (sellerId) => {
      const seller = sellersById.get(sellerId);
      if (!seller) return;

      const sellerItems = listings
        .filter((listing) => listing.seller.toString() === sellerId)
        .map((listing) => {
          const quantity = requestedQuantityById.get(listing._id.toString()) ?? 0;
          return {
            title: listing.title,
            quantity,
            lineTotalCents: listing.priceCents * quantity
          };
        });

      await sendSellerOrderEmail(seller.email, {
        buyerEmail: buyer.email,
        buyerName: displayName(buyer),
        items: sellerItems,
        sellerName: displayName(seller)
      });
    }));
  } catch {
    throw new AppError("Order was recorded, but notification email could not be sent right now.", 503);
  }

  sendSuccess(res, { totalCents }, "Order notification emails sent");
});

export const sendServiceCompletedNotification = asyncHandler(async (req: Request, res: Response) => {
  const actor = await currentUser(req.user?.id);
  const listing = await Listing.findById(req.body.listingId);

  if (!listing) throw new AppError("Listing not found", 404);
  if (listing.type !== "service") throw new AppError("Only service listings can be completed", 400);
  if (req.user?.role !== "admin" && listing.seller.toString() !== actor._id.toString()) {
    throw new AppError("Only the service owner can complete this service", 403);
  }

  const seller = await User.findById(listing.seller).select("displayName firstName lastName email");
  if (!seller) throw new AppError("Seller not found", 404);

  try {
    await sendServiceCompletedEmail(seller.email, {
      listingTitle: listing.title,
      sellerName: displayName(seller),
      completedAt: readableDateTime(req.body.completedAt ?? new Date().toISOString()),
      customerEmail: req.body.customerEmail,
      customerName: req.body.customerName
    });
  } catch {
    throw new AppError("Unable to send service completion email right now. Please try again later.", 503);
  }

  sendSuccess(res, null, "Service completion email sent");
});
