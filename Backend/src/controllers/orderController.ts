import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Listing } from "../models/Listing";
import { Order } from "../models/Order";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

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
    sendSuccess(res, { orders }, "Mock order(s) placed", 201);
  } catch (error) {
    if (created.length) await Order.deleteMany({ _id: { $in: created }, buyer });
    if (reserved.length) await Promise.all(reserved.map(({ id, quantity }) => Listing.updateOne({ _id: id }, { $inc: { quantityAvailable: quantity } })));
    throw error;
  }
});

export const listBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ buyer: req.user?.id }).sort({ createdAt: -1 }).populate("vendor", "displayName").lean();
  sendSuccess(res, { orders });
});
