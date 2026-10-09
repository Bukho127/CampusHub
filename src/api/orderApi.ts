import { apiRequest } from "./client";

export type OrderPaymentMethod = "snapscan" | "cash" | "card" | "eft" | "other";

export function placeOrders(token: string, items: { listingId: string; quantity: number }[], paymentMethod: OrderPaymentMethod) {
  return apiRequest<{ orders: { _id: string; amountCents: number; receiptNumber: string }[] }>("/orders", {
    method: "POST",
    token,
    body: JSON.stringify({ items, paymentMethod })
  });
}
