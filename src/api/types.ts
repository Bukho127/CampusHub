export type BackendVerificationState = "unverified" | "pending" | "verified";
export type BackendIdentityType = "student" | "faculty" | "resident" | "vendor";
export type BackendRole = "user" | "vendor" | "admin";
export type BackendSellerType = "casual" | "vendor";
export type BackendListingType = "goods" | "service";
export type BackendListingStatus = "active" | "sold" | "draft";
export type BackendCondition = "New" | "Like New" | "Good" | "Fair";

export type BackendCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type BackendUser = {
  _id: string;
  displayName: string;
  identityType: BackendIdentityType;
  role?: BackendRole;
  emailVerificationStatus?: BackendVerificationState;
  vendorVerificationStatus?: BackendVerificationState;
  rating?: number | null;
  reviewCount?: number;
  location?: string | null;
  avatar?: string | null;
  createdAt?: string;
};

export type BackendImage = {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  alt: string;
};

export type BackendListing = {
  _id: string;
  type: BackendListingType;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  currency: "ZAR";
  condition?: BackendCondition;
  quantityAvailable?: number;
  serviceMode?: "enquiry";
  images: BackendImage[];
  location: string;
  seller: string | BackendUser;
  sellerType: BackendSellerType;
  status: BackendListingStatus;
  negotiable: boolean;
  tradeEnabled: boolean;
  rating?: number | null;
  reviewCount?: number;
  createdAt: string;
};

export type BackendCommunityPost = {
  _id: string;
  title: string;
  summary: string;
  body?: string;
  type: "announcement" | "event" | "service";
  dateLabel: string;
  author?: string | BackendUser;
  createdAt?: string;
};
