import { categories, listings, sellers } from "../mocks/marketplace";
import type { Listing, ListingFilters, Seller } from "../models/marketplace";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function byQuery(listing: Listing, seller: Seller | undefined, query: string) {
  const target = normalize(`${listing.title} ${listing.description} ${seller?.displayName ?? ""}`);
  return target.includes(normalize(query));
}

export async function getCategories() {
  return categories;
}

export async function getSellers() {
  return sellers;
}

export async function getSellerById(id: string) {
  return sellers.find((seller) => seller.id === id) ?? null;
}

export async function getListingById(id: string) {
  return listings.find((listing) => listing.id === id) ?? null;
}

export async function getListings(filters: ListingFilters = {}) {
  let results = listings.filter((listing) => listing.status === "active");

  if (filters.query) {
    results = results.filter((listing) => byQuery(listing, sellers.find((seller) => seller.id === listing.sellerId), filters.query ?? ""));
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    results = results.filter((listing) => listing.categoryId === filters.categoryId);
  }

  if (filters.minPriceCents !== undefined) {
    results = results.filter((listing) => listing.priceCents >= (filters.minPriceCents ?? 0));
  }

  if (filters.maxPriceCents !== undefined) {
    results = results.filter((listing) => listing.priceCents <= (filters.maxPriceCents ?? Number.MAX_SAFE_INTEGER));
  }

  if (filters.condition) {
    results = results.filter((listing) => listing.type === "goods" && listing.condition === filters.condition);
  }

  if (filters.location) {
    results = results.filter((listing) => normalize(listing.location).includes(normalize(filters.location ?? "")));
  }

  if (filters.sellerType) {
    results = results.filter((listing) => listing.sellerType === filters.sellerType);
  }

  if (filters.minRating !== undefined) {
    results = results.filter((listing) => listing.rating !== undefined && listing.rating >= (filters.minRating ?? 0));
  }

  switch (filters.sort) {
    case "newest":
      results = [...results].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      break;
    case "priceLow":
      results = [...results].sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "priceHigh":
      results = [...results].sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "rating":
      results = [...results].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    default:
      results = [...results].sort((a, b) => Number(Boolean(b.rating)) - Number(Boolean(a.rating)));
  }

  return results;
}

export async function getListingsBySeller(sellerId: string) {
  return listings.filter((listing) => listing.sellerId === sellerId && listing.status === "active");
}
