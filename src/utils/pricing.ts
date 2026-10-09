import type { Listing } from "../models/marketplace";

export function getEffectivePriceCents(listing: Listing) {
  const discountPercent = Math.min(90, Math.max(0, listing.discountPercent ?? 0));
  return Math.round(listing.priceCents * (100 - discountPercent) / 100);
}
