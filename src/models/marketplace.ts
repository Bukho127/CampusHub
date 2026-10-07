import type { AssetSlot } from "../theme/assets";

export type UserType = "student" | "faculty" | "resident" | "vendor";
export type VerificationState = "unverified" | "pending" | "verified";
export type ListingCondition = "New" | "Like New" | "Good" | "Fair";
export type DietaryTag = "healthy" | "vegan" | "vegetarian" | "halal";
export type SellerType = "casual" | "vendor";
export type ListingStatus = "active" | "sold" | "draft";
export type ListingType = "goods" | "service";

export type Seller = {
  id: string;
  displayName: string;
  identityType: UserType;
  sellerType: SellerType;
  verificationState: VerificationState;
  verificationLabel?: string;
  rating?: number;
  reviewCount: number;
  location: string;
  bio: string;
  avatarUrl?: string;
  avatarSlot?: AssetSlot;
};

export type Category = {
  id: string;
  name: string;
};

export type ProductImage = {
  id: string;
  slot: AssetSlot;
  url?: string;
  alt: string;
};

type ListingBase = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  categoryId: string;
  priceCents: number;
  currency: "ZAR";
  location: string;
  sellerId: string;
  seller?: Seller;
  sellerType: SellerType;
  rating?: number;
  reviewCount: number;
  images: ProductImage[];
  status: ListingStatus;
  createdAt: string;
  negotiable: boolean;
};

export type GoodsListing = ListingBase & {
  type: "goods";
  condition?: ListingCondition;
  dietaryTags?: DietaryTag[];
  quantityAvailable: number;
  tradeEnabled: boolean;
};

export type ServiceListing = ListingBase & {
  type: "service";
  serviceMode: "enquiry";
  condition?: never;
  quantityAvailable?: never;
  tradeEnabled?: never;
};

export type Listing = GoodsListing | ServiceListing;

export type SortMode =
  | "recommended"
  | "newest"
  | "priceLow"
  | "priceHigh"
  | "rating";

export type ListingFilters = {
  query?: string;
  categoryId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  condition?: ListingCondition;
  location?: string;
  sellerType?: SellerType;
  minRating?: number;
  sort?: SortMode;
};

export type CommunityPost = {
  id: string;
  title: string;
  summary: string;
  body?: string;
  type: "announcement" | "event" | "service";
  dateLabel: string;
  imageUrl?: string;
  imageAlt?: string;
  authorName?: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: CommunityComment[];
  createdAt?: string;
};

export type CommunityComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt?: string;
};
