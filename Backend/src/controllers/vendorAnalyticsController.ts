import { Types } from "mongoose";
import type { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import type { Types as MongooseTypes } from "mongoose";

const paidStatuses = ["paid", "partially_refunded", "refunded"];

interface MonthlySalesRow {
  _id: { year: number; month: number };
  revenueCents: number;
  orderCount: number;
}

interface PaymentMethodRow {
  _id: string;
  orderCount: number;
  amountCents: number;
}

interface OrderStatusRow {
  _id: string;
  orderCount: number;
}

interface TopProductRow {
  _id: Types.ObjectId;
  title: string;
  revenueCents: number;
  unitsSold: number;
}
interface RevenueTrendRow {
  _id: string;
  revenueCents: number;
  orderCount: number;
}

interface RatingDistributionRow {
  _id: number;
  reviewCount: number;
}

interface MonthlyRatingRow {
  _id: { year: number; month: number };
  averageRating: number;
  reviewCount: number;
}

function getVendorObjectId(req: Request) {
  const vendorId = req.user?.id;

  if (!vendorId) {
    throw new AppError("Authentication required", 401);
  }

  return new Types.ObjectId(vendorId);
}

function monthLabel(month: number) {
  return new Date(2024, month - 1, 1).toLocaleString("en", {
    month: "short"
  });
}

export const getVendorOverview = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = getVendorObjectId(req);

    const [orderStats, activeListings, vendor, reviewCount] = await Promise.all([
      Order.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            paidOrderCount: {
              $sum: {
                $cond: [{ $in: ["$paymentStatus", paidStatuses] }, 1, 0]
              }
            },
            grossSalesCents: {
              $sum: {
                $cond: [
                  { $in: ["$paymentStatus", paidStatuses] },
                  "$amountCents",
                  0
                ]
              }
            },
            refundsCents: { $sum: "$refundedAmountCents" },
            escrowHeldCents: {
              $sum: {
                $cond: [
                  { $eq: ["$escrowStatus", "held"] },
                  "$amountCents",
                  0
                ]
              }
            }
          }
        }
      ]),
      Listing.countDocuments({ seller: vendorId, status: "active" }),
      User.findById(vendorId).select("rating reviewCount"),
      Review.countDocuments({ seller: vendorId, moderationStatus: { $ne: "hidden" } })
    ]);

    const stats = orderStats[0] ?? {
      orderCount: 0,
      paidOrderCount: 0,
      grossSalesCents: 0,
      refundsCents: 0,
      escrowHeldCents: 0
    };

    sendSuccess(res, {
      grossSalesCents: stats.grossSalesCents,
      refundsCents: stats.refundsCents,
      netEarningsCents: stats.grossSalesCents - stats.refundsCents,
      escrowHeldCents: stats.escrowHeldCents,
      orderCount: stats.orderCount,
      averageOrderValueCents:
        stats.paidOrderCount > 0
          ? Math.round(stats.grossSalesCents / stats.paidOrderCount)
          : 0,
      averageRating: vendor?.rating ?? 0,
      reviewCount: vendor?.reviewCount ?? reviewCount,
      activeListings
    });
  }
);

export const getVendorSalesByMonth = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = getVendorObjectId(req);
    const year = Number(req.query.year ?? new Date().getFullYear());
    const start = new Date(Date.UTC(year - 1, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await Order.aggregate<MonthlySalesRow>([
      {
        $match: {
          vendor: vendorId,
          paymentStatus: { $in: paidStatuses },
          createdAt: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenueCents: { $sum: "$amountCents" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    function fillYear(targetYear: number) {
      return Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const row = rows.find(
          (entry) =>
            entry._id.year === targetYear && entry._id.month === month
        );

        return {
          month,
          label: monthLabel(month),
          revenueCents: row?.revenueCents ?? 0,
          orderCount: row?.orderCount ?? 0
        };
      });
    }

    sendSuccess(res, {
      year,
      months: fillYear(year),
      previousYear: year - 1,
      previousYearMonths: fillYear(year - 1)
    });
  }
);

export const getVendorPaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = getVendorObjectId(req);

    const rows = await Order.aggregate<PaymentMethodRow>([
      {
        $match: {
          vendor: vendorId,
          paymentStatus: { $in: paidStatuses }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          orderCount: { $sum: 1 },
          amountCents: { $sum: "$amountCents" }
        }
      },
      { $sort: { amountCents: -1 } }
    ]);

    sendSuccess(
      res,
      rows.map((row) => ({
        method: row._id,
        orderCount: row.orderCount,
        amountCents: row.amountCents
      }))
    );
  }
);

export const getVendorOrdersByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = getVendorObjectId(req);

    const rows = await Order.aggregate<OrderStatusRow>([
      { $match: { vendor: vendorId } },
      { $group: { _id: "$status", orderCount: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(
      res,
      rows.map((row) => ({
        status: row._id,
        orderCount: row.orderCount
      }))
    );
  }
);

export const getVendorTopProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = getVendorObjectId(req);

    const rows = await Order.aggregate<TopProductRow>([
      {
        $match: {
          vendor: vendorId,
          paymentStatus: { $in: paidStatuses }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.listing",
          title: { $first: "$items.title" },
          revenueCents: { $sum: "$items.lineTotalCents" },
          unitsSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { revenueCents: -1 } },
      { $limit: 5 }
    ]);

    sendSuccess(
      res,
      rows.map((row) => ({
        listingId: String(row._id),
        title: row.title,
        revenueCents: row.revenueCents,
        unitsSold: row.unitsSold
      }))
    );
  }
);

export const getVendorRevenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = getVendorObjectId(req);
  const interval = String(req.query.interval ?? "daily");
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dateFormat =
    interval === "weekly"
      ? "%G-W%V"
      : interval === "monthly"
        ? "%Y-%m"
        : "%Y-%m-%d";

  const rows = await Order.aggregate<RevenueTrendRow>([
    {
      $match: {
        vendor: vendorId,
        paymentStatus: { $in: paidStatuses },
        createdAt: { $gte: from, $lte: to }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: "$createdAt",
            timezone: "UTC"
          }
        },
        revenueCents: { $sum: "$amountCents" },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  sendSuccess(res, {
    interval,
    from,
    to,
    points: rows.map((row) => ({
      date: row._id,
      revenueCents: row.revenueCents,
      orderCount: row.orderCount
    }))
  });
});

export const getVendorRatingDistribution = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = getVendorObjectId(req);
  const rows = await Review.aggregate<RatingDistributionRow>([
      { $match: { seller: vendorId, moderationStatus: { $ne: "hidden" } } },
    { $group: { _id: "$rating", reviewCount: { $sum: 1 } } }
  ]);

  sendSuccess(
    res,
    [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      reviewCount: rows.find((row) => row._id === rating)?.reviewCount ?? 0
    }))
  );
});

export const getVendorAverageRatingByMonth = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = getVendorObjectId(req);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const rows = await Review.aggregate<MonthlyRatingRow>([
    { $match: { seller: vendorId, moderationStatus: { $ne: "hidden" }, createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const row = rows.find(
      (entry) => entry._id.year === year && entry._id.month === month
    );

    return {
      year,
      month,
      label: date.toLocaleString("en", { month: "short", timeZone: "UTC" }),
      averageRating: row ? Number(row.averageRating.toFixed(2)) : 0,
      reviewCount: row?.reviewCount ?? 0
    };
  });

  sendSuccess(res, months);
});

export const getVendorRecentOrders = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = getVendorObjectId(req);
  const orders = await Order.find({ vendor: vendorId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("buyer items amountCents status paymentStatus createdAt receiptNumber")
    .populate("buyer", "displayName");

  sendSuccess(res, { orders });
});

export const getVendorRecentReviews = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = getVendorObjectId(req);
  const reviews = await Review.find({ seller: vendorId, moderationStatus: { $ne: "hidden" } })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("reviewer listing rating comment createdAt")
    .populate("reviewer", "displayName");

  sendSuccess(res, { reviews });
});
