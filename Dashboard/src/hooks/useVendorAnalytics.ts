import { useApi } from "./useApi";
import type {
  MonthlyRating,
  MonthlySales,
  OrderStatusSummary,
  PaymentMethodSummary,
  RatingDistribution,
  RecentOrder,
  RecentReview,
  RevenueTrend,
  TopProduct,
  VendorOverview
} from "../api/vendorAnalytics";

export function useVendorAnalytics(
  year: number,
  interval: "daily" | "weekly" | "monthly",
  from: string,
  to: string,
  enabled: boolean
) {
  const overview = useApi<VendorOverview>(
    enabled ? "/vendor/dashboard/overview" : null
  );

  const monthlySales = useApi<MonthlySales>(
    enabled ? `/vendor/analytics/sales-by-month?year=${year}` : null
  );

  const revenueTrend = useApi<RevenueTrend>(
    enabled
      ? `/vendor/analytics/revenue-trend?interval=${interval}&from=${from}&to=${to}`
      : null
  );

  const paymentMethods = useApi<PaymentMethodSummary[]>(
    enabled ? "/vendor/analytics/payment-methods" : null
  );

  const ordersByStatus = useApi<OrderStatusSummary[]>(
    enabled ? "/vendor/analytics/orders-by-status" : null
  );

  const topProducts = useApi<TopProduct[]>(
    enabled ? "/vendor/analytics/top-products" : null
  );

  const ratingDistribution = useApi<RatingDistribution[]>(
    enabled ? "/vendor/analytics/rating-distribution" : null
  );

  const monthlyRatings = useApi<MonthlyRating[]>(
    enabled ? "/vendor/analytics/average-rating-by-month" : null
  );

  const recentOrders = useApi<{ orders: RecentOrder[] }>(
    enabled ? "/vendor/dashboard/recent-orders" : null
  );

  const recentReviews = useApi<{ reviews: RecentReview[] }>(
    enabled ? "/vendor/dashboard/recent-reviews" : null
  );

  return {
    overview,
    monthlySales,
    revenueTrend,
    paymentMethods,
    ordersByStatus,
    topProducts,
    ratingDistribution,
    monthlyRatings,
    recentOrders,
    recentReviews
  };
}