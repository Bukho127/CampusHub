import { Router } from "express";
import {
  getVendorOrdersByStatus,
  getVendorOverview,
  getVendorPaymentMethods,
  getVendorSalesByMonth,
  getVendorTopProducts,
  getVendorAverageRatingByMonth,
  getVendorRatingDistribution,
  getVendorRecentOrders,
  getVendorRecentReviews,
  getVendorRevenueTrend
} from "../controllers/vendorAnalyticsController";
import {
  completeVendorOrder,
  getVendorOrder,
  listVendorOrders,
  markVendorCashReceived
} from "../controllers/vendorOrderController";
import { listVendorListings } from "../controllers/vendorListingController";
import { createVendorPost, deleteVendorPost, getVendorEarnings, getVendorProfile, listVendorPosts, listVendorReviews, updateVendorPost, updateVendorProfile } from "../controllers/vendorAccountController";
import { authenticate, requireRoles } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import {
  vendorOrderListQuerySchema,
  vendorListingQuerySchema,
  vendorRevenueTrendQuerySchema,
  vendorSalesQuerySchema,
  vendorPageQuerySchema,
  vendorProfileSchema,
  vendorEarningsQuerySchema
} from "../validators/vendorValidators";
import { createCommunityPostSchema } from "../validators/communityValidators";


export const vendorRouter = Router();

vendorRouter.use(authenticate, requireRoles("vendor"));

vendorRouter.get("/orders", validate({ query: vendorOrderListQuerySchema }), listVendorOrders);
vendorRouter.get("/orders/:id", validate({ params: mongoIdParamSchema }), getVendorOrder);
vendorRouter.post("/orders/:id/mark-cash-received", validate({ params: mongoIdParamSchema }), markVendorCashReceived);
vendorRouter.patch("/orders/:id/complete", validate({ params: mongoIdParamSchema }), completeVendorOrder);
vendorRouter.get("/listings", validate({ query: vendorListingQuerySchema }), listVendorListings);
vendorRouter.get("/profile", getVendorProfile);
vendorRouter.patch("/profile", validate({ body: vendorProfileSchema }), updateVendorProfile);
vendorRouter.get("/reviews", validate({ query: vendorPageQuerySchema }), listVendorReviews);
vendorRouter.get("/community-posts", validate({ query: vendorPageQuerySchema }), listVendorPosts);
vendorRouter.post("/community-posts", validate({ body: createCommunityPostSchema }), createVendorPost);
vendorRouter.patch("/community-posts/:id", validate({ params: mongoIdParamSchema, body: createCommunityPostSchema }), updateVendorPost);
vendorRouter.delete("/community-posts/:id", validate({ params: mongoIdParamSchema }), deleteVendorPost);
vendorRouter.get("/earnings", validate({ query: vendorEarningsQuerySchema }), getVendorEarnings);

vendorRouter.get("/dashboard/overview", getVendorOverview);
vendorRouter.get(
  "/analytics/sales-by-month",
  validate({ query: vendorSalesQuerySchema }),
  getVendorSalesByMonth
);
vendorRouter.get("/analytics/payment-methods", getVendorPaymentMethods);
vendorRouter.get("/analytics/orders-by-status", getVendorOrdersByStatus);
vendorRouter.get("/analytics/top-products", getVendorTopProducts);
vendorRouter.get("/analytics/revenue-trend", validate({ query: vendorRevenueTrendQuerySchema }), getVendorRevenueTrend);
vendorRouter.get("/analytics/rating-distribution", getVendorRatingDistribution);
vendorRouter.get("/analytics/average-rating-by-month", getVendorAverageRatingByMonth);
vendorRouter.get("/dashboard/recent-orders", getVendorRecentOrders);
vendorRouter.get("/dashboard/recent-reviews", getVendorRecentReviews);
