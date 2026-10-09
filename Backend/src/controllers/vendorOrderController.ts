import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import { Order } from "../models/Order";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

function currentVendorId(req: Request) {
  const vendorId = req.user?.id;
  if (!vendorId) throw new AppError("Authentication required", 401);
  return vendorId;
}

export const listVendorOrders = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = currentVendorId(req);
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status;
  const filter = {
    vendor: vendorId,
    ...(typeof status === "string" ? { status } : {})
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("buyer items amountCents status paymentMethod paymentStatus escrowStatus receiptNumber createdAt updatedAt")
      .populate("buyer", "displayName")
      .lean(),
    Order.countDocuments(filter)
  ]);

  sendSuccess(res, { orders }, "Vendor orders loaded", 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

export const getVendorOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({
    _id: req.params.id,
    vendor: currentVendorId(req)
  })
    .populate("buyer", "displayName")
    .populate("items.listing", "title");

  if (!order) throw new AppError("Order not found", 404);
  sendSuccess(res, { order });
});

export const markVendorCashReceived = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = currentVendorId(req);
  const receiptNumber = `CS-${randomBytes(6).toString("hex").toUpperCase()}`;
  const pendingOrder = await Order.findOne({
    _id: req.params.id,
    vendor: vendorId,
    paymentMethod: "cash",
    paymentStatus: "pending"
  }).select("amountCents");

  if (!pendingOrder) {
    const existing = await Order.findOne({ _id: req.params.id, vendor: vendorId });
    if (!existing) throw new AppError("Order not found", 404);
    if (existing.paymentMethod === "cash" && existing.paymentStatus === "paid") {
      sendSuccess(res, { order: existing }, "Cash receipt was already recorded");
      return;
    }
    throw new AppError("This order cannot be marked as cash received", 409);
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      vendor: vendorId,
      paymentMethod: "cash",
      paymentStatus: "pending"
    },
    {
      $set: { paymentStatus: "paid", receiptNumber },
      $push: {
        paymentHistory: {
          status: "paid",
          amountCents: pendingOrder.amountCents,
          method: "cash",
          receiptNumber,
          note: "Cash receipt confirmed by vendor",
          occurredAt: new Date()
        }
      }
    },
    { new: true, runValidators: true }
  );

  if (order) {
    sendSuccess(res, { order }, "Cash receipt recorded");
    return;
  }

  const existing = await Order.findOne({ _id: req.params.id, vendor: vendorId });
  if (!existing) throw new AppError("Order not found", 404);
  if (existing.paymentMethod === "cash" && existing.paymentStatus === "paid") {
    sendSuccess(res, { order: existing }, "Cash receipt was already recorded");
    return;
  }
  throw new AppError("This order cannot be marked as cash received", 409);
});

export const completeVendorOrder = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = currentVendorId(req);
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      vendor: vendorId,
      paymentStatus: "paid",
      status: { $in: ["confirmed", "processing", "ready"] }
    },
    { $set: { status: "completed" } },
    { new: true, runValidators: true }
  );

  if (order) {
    sendSuccess(res, { order }, "Order marked completed");
    return;
  }

  const existing = await Order.findOne({ _id: req.params.id, vendor: vendorId });
  if (!existing) throw new AppError("Order not found", 404);
  if (existing.status === "completed") {
    sendSuccess(res, { order: existing }, "Order was already completed");
    return;
  }
  throw new AppError("Only paid orders can be completed", 409);
});
