import { toAbsoluteApiUrl } from "../api/config";
import { fetchCategories, fetchListingById, fetchListings, fetchListingsBySeller, fetchSellerById } from "../api/marketplaceApi";
import type { BackendCategory, BackendListing, BackendUser } from "../api/types";
import { categories as mockCategories, listings as mockListings, sellers as mockSellers } from "../mocks/marketplace";
import type { Category, Listing, ListingFilters, ProductImage, Seller } from "../models/marketplace";
import type { AssetSlot } from "../theme/assets";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function mockByQuery(listing: Listing, seller: Seller | undefined, query: string) {
  const target = normalize(`${listing.title} ${listing.description} ${seller?.displayName ?? ""}`);
  return target.includes(normalize(query));
}

function isBackendUser(value: BackendListing["seller"]): value is BackendUser {
  return typeof value === "object" && value !== null;
}

function categoryToSlot(category: string, title: string): AssetSlot {
  const target = normalize(`${category} ${title}`);

  if (target.includes("food") || target.includes("isijokojoko")) return "isijokojoko";
  if (target.includes("calculator")) return "calculator";
  if (target.includes("java") || target.includes("textbook")) return "javaTextbook";
  if (target.includes("iphone") || target.includes("phone")) return "iphone12";
  if (target.includes("desk") || target.includes("chair") || target.includes("furniture")) return "deskChair";
  if (target.includes("photo") || target.includes("service")) return "photography";
  return "notebook";
}

function mapCategory(category: BackendCategory): Category {
  return {
    id: category.slug,
    name: category.name
  };
}

function mapSeller(seller: BackendUser): Seller {
  const verified = seller.vendorVerificationStatus === "verified" || seller.emailVerificationStatus === "verified";
  const id = seller.id ?? seller._id ?? "";

  return {
    id,
    displayName: seller.displayName,
    identityType: seller.identityType,
    sellerType: seller.role === "vendor" && seller.vendorVerificationStatus === "verified" ? "vendor" : "casual",
    verificationState: verified ? "verified" : seller.vendorVerificationStatus ?? seller.emailVerificationStatus ?? "unverified",
    rating: seller.rating ?? undefined,
    reviewCount: seller.reviewCount ?? 0,
    location: seller.location ?? "Campus community",
    bio: "Community Store seller profile. Public contact details stay private until trusted workflows are integrated."
  };
}

function mapImages(listing: BackendListing): ProductImage[] {
  if (!listing.images.length) {
    return [
      {
        id: `${listing._id}-placeholder`,
        slot: categoryToSlot(listing.category, listing.title),
        alt: listing.title
      }
    ];
  }

  return listing.images.map((image, index) => ({
    id: `${listing._id}-image-${index}`,
    slot: categoryToSlot(listing.category, listing.title),
    url: image.url && image.size > 0 ? toAbsoluteApiUrl(image.url) : undefined,
    alt: image.alt || listing.title
  }));
}

function mapListing(listing: BackendListing): Listing {
  const seller = isBackendUser(listing.seller) ? mapSeller(listing.seller) : undefined;
  const sellerId = isBackendUser(listing.seller) ? listing.seller.id ?? listing.seller._id ?? "" : listing.seller;
  const base = {
    id: listing._id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    categoryId: listing.category,
    priceCents: listing.priceCents,
    currency: listing.currency,
    location: listing.location,
    sellerId,
    seller,
    sellerType: listing.sellerType,
    rating: listing.rating ?? undefined,
    reviewCount: listing.reviewCount ?? 0,
    images: mapImages(listing),
    status: listing.status,
    createdAt: listing.createdAt,
    negotiable: listing.negotiable
  };

  if (listing.type === "service") {
    return {
      ...base,
      type: "service",
      serviceMode: listing.serviceMode ?? "enquiry"
    };
  }

  return {
    ...base,
    type: "goods",
    condition: listing.condition ?? "Good",
    quantityAvailable: listing.quantityAvailable ?? 0,
    tradeEnabled: listing.tradeEnabled
  };
}

function toApiQuery(filters: ListingFilters) {
  return {
    q: filters.query,
    category: filters.categoryId === "all" ? undefined : filters.categoryId,
    minPrice: filters.minPriceCents,
    maxPrice: filters.maxPriceCents,
    condition: filters.condition,
    location: filters.location,
    sellerType: filters.sellerType,
    minRating: filters.minRating,
    sort: filters.sort,
    limit: 50
  };
}

function filterMockListings(filters: ListingFilters = {}) {
  let results = mockListings.filter((listing) => listing.status === "active");

  if (filters.query) {
    results = results.filter((listing) => mockByQuery(listing, mockSellers.find((seller) => seller.id === listing.sellerId), filters.query ?? ""));
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    results = results.filter((listing) => listing.categoryId === filters.categoryId);
  }

  if (filters.condition) {
    results = results.filter((listing) => listing.type === "goods" && listing.condition === filters.condition);
  }

  if (filters.sellerType) {
    results = results.filter((listing) => listing.sellerType === filters.sellerType);
  }

  if (filters.minRating !== undefined) {
    results = results.filter((listing) => listing.rating !== undefined && listing.rating >= (filters.minRating ?? 0));
  }

  switch (filters.sort) {
    case "newest":
      return [...results].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case "priceLow":
      return [...results].sort((a, b) => a.priceCents - b.priceCents);
    case "priceHigh":
      return [...results].sort((a, b) => b.priceCents - a.priceCents);
    case "rating":
      return [...results].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    default:
      return [...results].sort((a, b) => Number(Boolean(b.rating)) - Number(Boolean(a.rating)));
  }
}

function withMockFallback<T>(request: Promise<T>, fallback: () => T) {
  return request.catch(() => fallback());
}

export async function getCategories() {
  return withMockFallback(
    fetchCategories().then((items) => [{ id: "all", name: "See All" }, ...items.map(mapCategory)]),
    () => mockCategories
  );
}

export async function getSellers() {
  return withMockFallback(
    fetchListings({ limit: 50 }).then((items) => {
      const sellers = new Map<string, Seller>();
      items.forEach((item) => {
        if (isBackendUser(item.seller)) {
          const seller = mapSeller(item.seller);
          sellers.set(seller.id, seller);
        }
      });
      return [...sellers.values()];
    }),
    () => mockSellers
  );
}

export async function getSellerById(id: string) {
  return withMockFallback(
    fetchSellerById(id).then(mapSeller),
    () => mockSellers.find((seller) => seller.id === id) ?? null
  );
}

export async function getListingById(id: string) {
  return withMockFallback(
    fetchListingById(id).then(mapListing),
    () => mockListings.find((listing) => listing.id === id) ?? null
  );
}

export async function getListings(filters: ListingFilters = {}) {
  return withMockFallback(
    fetchListings(toApiQuery(filters)).then((items) => items.map(mapListing)),
    () => filterMockListings(filters)
  );
}

export async function getListingsBySeller(sellerId: string) {
  return withMockFallback(
    fetchListingsBySeller(sellerId).then((items) => items.map(mapListing)),
    () => mockListings.filter((listing) => listing.sellerId === sellerId && listing.status === "active")
  );
}
