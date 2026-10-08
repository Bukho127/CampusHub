import { hashCachePart, sortObjectKeys } from "../config/cache";

type CacheNamespace =
  | "categories"
  | "community"
  | "community-post"
  | "listing"
  | "listings"
  | "public-user"
  | "reviews"
  | "seller"
  | "seller-listings";

const versions = new Map<CacheNamespace, number>();

function getVersion(namespace: CacheNamespace) {
  return versions.get(namespace) ?? 1;
}

function bumpVersion(namespace: CacheNamespace) {
  versions.set(namespace, getVersion(namespace) + 1);
}

export function cacheKey(namespace: CacheNamespace, identifier: string) {
  return `${namespace}:v${getVersion(namespace)}:${identifier}`;
}

export function queryCacheKey(namespace: CacheNamespace, query: Record<string, unknown>) {
  return cacheKey(namespace, `list:${hashCachePart(sortObjectKeys(query))}`);
}

export function invalidateCategories() {
  bumpVersion("categories");
}

export function invalidateListings(_listingId?: string, sellerId?: string) {
  bumpVersion("listings");
  bumpVersion("listing");
  if (sellerId) invalidateSeller(sellerId);
}

export function invalidateSeller(sellerId?: string) {
  bumpVersion("seller");
  bumpVersion("seller-listings");
  bumpVersion("public-user");
  if (sellerId) {
    bumpVersion("listings");
    bumpVersion("listing");
  }
}

export function invalidateReviews(sellerId?: string) {
  bumpVersion("reviews");
  invalidateSeller(sellerId);
}

export function invalidateCommunity() {
  bumpVersion("community");
  bumpVersion("community-post");
}

export function resetCacheVersions() {
  versions.clear();
}
