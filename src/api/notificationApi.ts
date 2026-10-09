import { apiRequest } from "./client";

type OrderNotificationItem = {
  listingId: string;
  quantity: number;
};

export async function notifyServiceRequested(payload: { listingId: string; note: string; preferredTime: string }, token: string) {
  await apiRequest<null>("/notifications/service-request", {
    body: JSON.stringify(payload),
    method: "POST",
    token
  });
}

export async function notifyOrderCompleted(payload: { items: OrderNotificationItem[]; paymentMethod: string }, token: string) {
  await apiRequest<{ totalCents: number }>("/notifications/order-completed", {
    body: JSON.stringify(payload),
    method: "POST",
    token
  });
}

export async function notifyServiceCompleted(payload: { listingId: string; customerEmail?: string; customerName?: string; completedAt?: string }, token: string) {
  await apiRequest<null>("/notifications/service-completed", {
    body: JSON.stringify(payload),
    method: "POST",
    token
  });
}
