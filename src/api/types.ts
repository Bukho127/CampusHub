export type BackendVerificationState = "unverified" | "pending" | "verified";
export type BackendIdentityType = "student" | "faculty" | "resident" | "vendor";
export type BackendRole = "user" | "vendor" | "admin";
export type BackendSellerType = "casual" | "vendor";
export type BackendListingType = "goods" | "service";
export type BackendListingStatus = "active" | "sold" | "draft";
export type BackendCondition = "New" | "Like New" | "Good" | "Fair";
export type BackendDietaryTag = "healthy" | "vegan" | "vegetarian" | "halal";

export type BackendCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type BackendUser = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  institutionId?: string | null;
  displayName: string;
  identityType: BackendIdentityType;
  role?: BackendRole;
  emailVerificationStatus?: BackendVerificationState;
  vendorVerificationStatus?: BackendVerificationState;
  campusEmailVerificationStatus?: BackendVerificationState;
  campusEmailVerified?: boolean;
  campusEmailVerifiedAt?: string | null;
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
  dietaryTags?: BackendDietaryTag[];
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

export type BackendReview = {
  _id: string;
  reviewer: { _id: string; displayName: string };
  rating: number;
  comment: string;
  createdAt: string;
};

export type BackendCommunityPost = {
  _id: string;
  title: string;
  summary: string;
  body?: string;
  type: "announcement" | "event" | "service";
  dateLabel: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  author?: string | BackendUser;
  image?: BackendImage;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  comments?: BackendCommunityComment[];
  createdAt?: string;
};

export type BackendCommunityComment = {
  _id: string;
  author?: string | BackendUser;
  body: string;
  createdAt?: string;
};
