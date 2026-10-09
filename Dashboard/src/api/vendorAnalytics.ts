export interface VendorOverview {
  grossSalesCents: number;
  refundsCents: number;
  netEarningsCents: number;
  escrowHeldCents: number;
  orderCount: number;
  averageOrderValueCents: number;
  averageRating: number;
  reviewCount: number;
  activeListings: number;
}

export interface SalesMonth {
  month: number;
  label: string;
  revenueCents: number;
  orderCount: number;
}

export interface MonthlySales {
  year: number;
  months: SalesMonth[];
  previousYear: number;
  previousYearMonths: SalesMonth[];
}

export interface RevenueTrendPoint {
  date: string;
  revenueCents: number;
  orderCount: number;
}

export interface RevenueTrend {
  interval: "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  points: RevenueTrendPoint[];
}

export interface PaymentMethodSummary {
  method: string;
  orderCount: number;
  amountCents: number;
}

export interface OrderStatusSummary {
  status: string;
  orderCount: number;
}

export interface TopProduct {
  listingId: string;
  title: string;
  revenueCents: number;
  unitsSold: number;
}

export interface RatingDistribution {
  rating: number;
  reviewCount: number;
}

export interface MonthlyRating {
  year: number;
  month: number;
  label: string;
  averageRating: number;
  reviewCount: number;
}

export interface RecentOrder {
  _id: string;
  amountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  receiptNumber?: string;
  buyer?: { displayName: string } | null;
}

export interface RecentReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: { displayName: string } | null;
}