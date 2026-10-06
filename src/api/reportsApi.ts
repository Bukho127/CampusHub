import { apiRequest } from "./client";

export async function reportSellerApi(sellerId: string, reason: string, details: string, token: string) {
  await apiRequest(`/reports/seller/${sellerId}`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason, details: details.trim() || undefined })
  });
}