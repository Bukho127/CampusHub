import { apiRequest } from "./client";
import type { BackendReview } from "./types";

export async function fetchSellerReviews(sellerId: string) {
  const response = await apiRequest<{ reviews: BackendReview[] }>(`/reviews/seller/${sellerId}`);
  return response.data.reviews;
}

export async function createSellerReview(sellerId: string, rating: number, comment: string, token: string) {
  const response = await apiRequest<{ review: BackendReview }>(`/reviews/seller/${sellerId}`, {
    method: "POST",
    token,
    body: JSON.stringify({ rating, comment })
  });
  return response.data.review;
}