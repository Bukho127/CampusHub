import { apiRequest } from "./client";
import type { BackendCategory, BackendListing, BackendUser } from "./types";

export type ListingQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sellerType?: string;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function fetchCategories() {
  const response = await apiRequest<{ categories: BackendCategory[] }>("/categories");
  return response.data.categories;
}

export async function fetchListings(query: ListingQuery = {}) {
  const response = await apiRequest<{ listings: BackendListing[] }>("/listings", { query });
  return response.data.listings;
}

export async function fetchListingById(id: string) {
  const response = await apiRequest<{ listing: BackendListing }>(`/listings/${id}`);
  return response.data.listing;
}

export async function fetchSellerById(id: string) {
  const response = await apiRequest<{ seller: BackendUser }>(`/sellers/${id}`);
  return response.data.seller;
}

export async function fetchListingsBySeller(sellerId: string) {
  const response = await apiRequest<{ listings: BackendListing[] }>(`/sellers/${sellerId}/listings`);
  return response.data.listings;
}

export async function deleteListingApi(id: string, token: string) {
  await apiRequest<null>(`/listings/${id}`, {
    method: "DELETE",
    token
  });
}
