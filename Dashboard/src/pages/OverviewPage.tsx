import { useState } from "react";

import { useAuth } from "../contexts/AuthContext";
import { useVendorAnalytics } from "../hooks/useVendorAnalytics";

import VendorBreakdownCharts from "../components/charts/VendorBreakdownCharts";
import VendorRatingCharts from "../components/charts/VendorRatingCharts";
import VendorRevenueTrendChart from "../components/charts/VendorRevenueTrendChart";
import VendorSalesChart from "../components/charts/VendorSalesChart";

type TrendInterval = "daily" | "weekly" | "monthly";
type SalesMode = "revenue" | "orders";

function formatMoney(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

export default function OverviewPage() {
  const { user } = useAuth();
  const isVendor = user?.role === "vendor";

  const [year, setYear] = useState(new Date().getFullYear());
  const [salesMode, setSalesMode] = useState<SalesMode>("revenue");
  const [interval, setInterval] = useState<TrendInterval>("daily");

  const [to, setTo] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
  );

  const analytics = useVendorAnalytics(
    year,
    interval,
    from,
    to,
    isVendor
  );

  const overview = analytics.overview.data;

  if (!isVendor) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
        <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">
          ADMIN WORKSPACE
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-campus-ink">
          Welcome, {user?.displayName ?? "there"}
        </h1>

        <p className="mt-2 text-[13px] leading-6 text-campus-muted">
          Platform analytics will be connected in the admin milestone.
        </p>
      </section>
    );
  }

  const allRequests = [
    analytics.overview,
    analytics.monthlySales,
    analytics.revenueTrend,
    analytics.paymentMethods,
    analytics.ordersByStatus,
    analytics.topProducts,
    analytics.ratingDistribution,
    analytics.monthlyRatings,
    analytics.recentOrders,
    analytics.recentReviews,
  ];

  const error = allRequests.find((request) => request.error)?.error;

  const metrics = [
    [
      "Gross sales",
      overview ? formatMoney(overview.grossSalesCents) : "—",
    ],
    [
      "Refunds",
      overview ? formatMoney(overview.refundsCents) : "—",
    ],
    [
      "Net earnings",
      overview ? formatMoney(overview.netEarningsCents) : "—",
    ],
    [
      "Money in escrow",
      overview ? formatMoney(overview.escrowHeldCents) : "—",
    ],
    [
      "Orders",
      overview ? String(overview.orderCount) : "—",
    ],
    [
      "Average order",
      overview
        ? formatMoney(overview.averageOrderValueCents)
        : "—",
    ],
    [
      "Average rating",
      overview ? overview.averageRating.toFixed(1) : "—",
    ],
    [
      "Active listings",
      overview ? String(overview.activeListings) : "—",
    ],
  ];

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">
          VENDOR WORKSPACE
        </p>

        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-campus-ink">
          Welcome, {user?.displayName ?? "there"}
        </h1>

        <p className="text-[13px] leading-6 text-campus-muted">
          Your store performance, orders, and customer feedback.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">
          Some dashboard data could not load: {error}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article
            className="min-h-[125px] rounded-xl border border-campus-line bg-campus-surface p-4"
            key={label}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-campus-muted">
              <span>{label}</span>
              <span className="h-2 w-2 rounded-full bg-orange-300" />
            </div>

            <strong className="mt-4 block text-2xl tracking-tight text-campus-ink">
              {value}
            </strong>
          </article>
        ))}
      </div>

      {analytics.monthlySales.data ? (
        <div className="mb-4">
          <VendorSalesChart
            data={analytics.monthlySales.data}
            mode={salesMode}
            onModeChange={setSalesMode}
            onYearChange={setYear}
          />
        </div>
      ) : null}

      {analytics.revenueTrend.data ? (
        <div className="mb-4">
          <VendorRevenueTrendChart
            data={analytics.revenueTrend.data}
            interval={interval}
            from={from}
            to={to}
            onIntervalChange={setInterval}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        </div>
      ) : null}

      {analytics.paymentMethods.data &&
      analytics.ordersByStatus.data &&
      analytics.topProducts.data ? (
        <div className="mb-4">
          <VendorBreakdownCharts
            paymentMethods={analytics.paymentMethods.data}
            ordersByStatus={analytics.ordersByStatus.data}
            topProducts={analytics.topProducts.data}
          />
        </div>
      ) : null}

      {analytics.ratingDistribution.data &&
      analytics.monthlyRatings.data ? (
        <div className="mb-4">
          <VendorRatingCharts
            distribution={analytics.ratingDistribution.data}
            monthlyRatings={analytics.monthlyRatings.data}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-campus-line bg-campus-surface">
          <div className="border-b border-campus-line px-5 py-4">
            <h2 className="text-[15px] font-extrabold text-campus-ink">
              Recent orders
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-campus-background text-campus-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {(analytics.recentOrders.data?.orders ?? []).map(
                  (order) => (
                    <tr
                      className="border-t border-campus-line"
                      key={order._id}
                    >
                      <td className="px-4 py-3">
                        {order.buyer?.displayName ?? "Buyer"}
                      </td>

                      <td className="px-4 py-3 text-campus-muted">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-4 py-3 capitalize">
                        {order.status}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMoney(order.amountCents)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {analytics.recentOrders.data?.orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-campus-subtle">
                No orders yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-campus-line bg-campus-surface">
          <div className="border-b border-campus-line px-5 py-4">
            <h2 className="text-[15px] font-extrabold text-campus-ink">
              Recent reviews
            </h2>
          </div>

          <div className="divide-y divide-campus-line">
            {(analytics.recentReviews.data?.reviews ?? []).map(
              (review) => (
                <article className="px-5 py-4" key={review._id}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <strong className="truncate text-xs text-campus-ink">
                      {review.reviewer?.displayName ?? "Customer"}
                    </strong>

                    <span className="shrink-0 text-xs text-campus-accent">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>

                  <p className="mb-1 text-xs leading-5 text-campus-muted">
                    {review.comment}
                  </p>

                  <time className="text-[10px] text-campus-subtle">
                    {formatDate(review.createdAt)}
                  </time>
                </article>
              )
            )}

            {analytics.recentReviews.data?.reviews.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-campus-subtle">
                No reviews yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}