import type { Request, Response } from "express";
import { Order } from "../models/Order";
import { recordAdminAudit } from "../utils/adminAudit";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const listAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, paymentStatus, escrowStatus, page = 1, limit = 20 } = req.query as Record<string, string | number | undefined>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (escrowStatus) filter.escrowStatus = escrowStatus;
  const pageNumber = Number(page); const limitNumber = Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).select("buyer vendor items amountCents refundedAmountCents currency status paymentMethod paymentStatus escrowStatus receiptNumber createdAt buyerConfirmedAt").populate("buyer", "displayName email").populate("vendor", "displayName email").sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
    Order.countDocuments(filter)
  ]);
  sendSuccess(res, { orders }, "Orders loaded", 200, { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) });
});

async function applyFullRefund(orderId: string, note: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus === "refunded") return { order, repeated: true };
  if (!["paid", "partially_refunded"].includes(order.paymentStatus)) {
    throw new AppError("Only paid orders can be refunded", 409);
  }
  const outstanding = order.amountCents - order.refundedAmountCents;
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: order.paymentStatus, refundedAmountCents: order.refundedAmountCents },
    {
      $set: { refundedAmountCents: order.amountCents, paymentStatus: "refunded", status: "refunded", ...(order.escrowStatus === "held" ? { escrowStatus: "refunded" } : {}) },
      $push: { paymentHistory: { status: "refunded", amountCents: outstanding, method: order.paymentMethod, note, occurredAt: new Date() } }
    },
    { new: true, runValidators: true }
  );
  if (updated) return { order: updated, repeated: false };
  const latest = await Order.findById(orderId);
  if (latest?.paymentStatus === "refunded") return { order: latest, repeated: true };
  throw new AppError("Order payment changed; refresh and try again", 409);
}

export const refundAdminOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await applyFullRefund(req.params.id, String(req.body.note ?? "Refund issued by administrator"));
  if (!result.repeated) await recordAdminAudit(req, "order.refunded", "order", String(result.order._id), { amountCents: result.order.refundedAmountCents, note: req.body.note });
  sendSuccess(res, { order: result.order }, result.repeated ? "Order was already refunded" : "Refund recorded");
});

export const releaseAdminEscrow = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, escrowStatus: "held", $or: [{ status: "completed" }, { buyerConfirmedAt: { $exists: true } }] },
    { $set: { escrowStatus: "released" } },
    { new: true, runValidators: true }
  );
  if (order) { await recordAdminAudit(req, "escrow.released", "order", String(order._id)); sendSuccess(res, { order }, "Escrow released"); return; }
  const existing = await Order.findById(req.params.id);
  if (!existing) throw new AppError("Order not found", 404);
  if (existing.escrowStatus === "released") { sendSuccess(res, { order: existing }, "Escrow was already released"); return; }
  throw new AppError("Escrow can only be released after completion or buyer confirmation", 409);
});

export const refundAdminEscrow = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  if (order.escrowStatus === "refunded" && order.paymentStatus === "refunded") {
    sendSuccess(res, { order }, "Escrow refund was already recorded"); return;
  }
  if (order.escrowStatus !== "held") throw new AppError("Only held escrow can be refunded", 409);
  const result = await applyFullRefund(req.params.id, String(req.body.note ?? "Escrow refund issued by administrator"));
  if (!result.repeated) await recordAdminAudit(req, "escrow.refunded", "order", String(result.order._id), { amountCents: result.order.refundedAmountCents, note: req.body.note });
  sendSuccess(res, { order: result.order }, result.repeated ? "Escrow refund was already recorded" : "Escrow refunded");
});
