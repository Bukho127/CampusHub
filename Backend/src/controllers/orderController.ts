import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Listing } from "../models/Listing";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { sendOrderReceiptEmail, sendSellerOrderEmail } from "../services/emailService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { invalidateListings } from "../utils/cacheKeys";

function displayName(user: { displayName?: string; firstName?: string; lastName?: string; email?: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "CampusHub user";
}

export const createBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  const buyer = req.user?.id;
  if (!buyer) throw new AppError("Authentication required", 401);
  const { items, paymentMethod } = req.body as { items: { listingId: string; quantity: number }[]; paymentMethod: "snapscan" | "cash" | "card" | "eft" | "other" };
  const ids = items.map((item) => new mongoose.Types.ObjectId(item.listingId));
  const listings = await Listing.find({ _id: { $in: ids }, status: "active", type: "goods" }).lean();
  if (listings.length !== items.length) throw new AppError("One or more items are unavailable", 409);

  const listingById = new Map(listings.map((listing) => [String(listing._id), listing]));
  const vendors = new Map<string, { listing: typeof listings[number]; quantity: number; unitPriceCents: number }[]>();
  for (const item of items) {
    const listing = listingById.get(item.listingId);
    if (!listing || (listing.quantityAvailable ?? 0) < item.quantity) throw new AppError("One or more items no longer have enough stock", 409);
    const vendorId = String(listing.seller);
    const group = vendors.get(vendorId) ?? [];
    group.push({ listing, quantity: item.quantity, unitPriceCents: Math.round(listing.priceCents * (100 - (listing.discountPercent ?? 0)) / 100) });
    vendors.set(vendorId, group);
  }

  const reserved: { id: mongoose.Types.ObjectId; quantity: number }[] = [];
  const created: mongoose.Types.ObjectId[] = [];
  try {
    for (const item of items) {
      const updated = await Listing.findOneAndUpdate(
        { _id: item.listingId, status: "active", type: "goods", quantityAvailable: { $gte: item.quantity } },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );
      if (!updated) throw new AppError("Stock changed during checkout. Please review your cart.", 409);
      if ((updated.quantityAvailable ?? 0) <= 0) {
        updated.status = "sold";
        await updated.save();
      }
      invalidateListings(updated._id.toString(), updated.seller.toString());
      reserved.push({ id: updated._id, quantity: item.quantity });
    }

    const orders = [];
    for (const [vendor, group] of vendors) {
      const orderItems = group.map(({ listing, quantity, unitPriceCents }) => ({
        listing: listing._id,
        title: listing.title,
        quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * quantity
      }));
      const amountCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      const isCash = paymentMethod === "cash";
      const receiptNumber = `MOCK-${randomBytes(6).toString("hex").toUpperCase()}`;
      const [order] = await Order.create([{
        buyer,
        vendor,
        items: orderItems,
        amountCents,
        status: "confirmed",
        paymentMethod,
        paymentStatus: isCash ? "pending" : "paid",
        receiptNumber,
        paymentHistory: [{
          status: isCash ? "pending" : "paid",
          amountCents,
          method: paymentMethod,
          receiptNumber,
          note: isCash ? "Cash due on collection" : "Simulation only; no funds were processed",
          occurredAt: new Date()
        }]
      }]);
      orders.push(order);
      created.push(order._id);
    }

    const [buyerUser, sellerUsers] = await Promise.all([
      User.findById(buyer).select("displayName firstName lastName email"),
      User.find({ _id: { $in: [...vendors.keys()] } }).select("displayName firstName lastName email")
    ]);

    if (buyerUser) {
      const sellersById = new Map(sellerUsers.map((seller) => [seller._id.toString(), seller]));
      const receiptItems = orders.flatMap((order) => order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents
      })));

      await sendOrderReceiptEmail(buyerUser.email, {
        buyerName: displayName(buyerUser),
        items: receiptItems,
        paymentMethod,
        totalCents: receiptItems.reduce((total, item) => total + item.lineTotalCents, 0)
      });

      await Promise.all(orders.map(async (order) => {
        const seller = sellersById.get(order.vendor.toString());
        if (!seller) return;
        await sendSellerOrderEmail(seller.email, {
          buyerEmail: buyerUser.email,
          buyerName: displayName(buyerUser),
          items: order.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents
          })),
          sellerName: displayName(seller)
        });
      }));
    }

    sendSuccess(res, { orders }, "Mock order(s) placed", 201);
  } catch (error) {
    if (created.length) await Order.deleteMany({ _id: { $in: created }, buyer });
    if (reserved.length) await Promise.all(reserved.map(({ id, quantity }) => Listing.updateOne({ _id: id }, { $inc: { quantityAvailable: quantity }, $set: { status: "active" } })));
    throw error;
  }
});

export const listBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ buyer: req.user?.id }).sort({ createdAt: -1 }).populate("vendor", "displayName").lean();
  sendSuccess(res, { orders });
});
