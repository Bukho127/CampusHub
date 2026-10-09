import { Schema, model, Types, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    lineTotalCents: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const paymentEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      required: true
    },
    amountCents: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true },
    receiptNumber: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    occurredAt: { type: Date, default: Date.now, required: true }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(items: unknown[]) => items.length > 0, "An order needs at least one item"]
    },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["ZAR"], default: "ZAR", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "ready", "completed", "cancelled", "refunded"],
      default: "pending",
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["snapscan", "cash", "card", "eft", "other"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      required: true
    },
    paymentHistory: { type: [paymentEventSchema], default: [] },
    refundedAmountCents: { type: Number, default: 0, min: 0 },
    escrowStatus: {
      type: String,
      enum: ["not_applicable", "held", "released", "refunded"],
      default: "not_applicable",
      required: true
    },
    buyerConfirmedAt: { type: Date },
    receiptNumber: { type: String, unique: true, sparse: true, trim: true }
  },
  { timestamps: true }
);

orderSchema.index({ vendor: 1, createdAt: -1 });
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, paymentStatus: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: Types.ObjectId;
};

export const Order = model("Order", orderSchema);