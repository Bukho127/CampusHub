import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  OrderStatusSummary,
  PaymentMethodSummary,
  TopProduct,
} from "../../api/vendorAnalytics";

interface VendorBreakdownChartsProps {
  paymentMethods: PaymentMethodSummary[];
  ordersByStatus: OrderStatusSummary[];
  topProducts: TopProduct[];
}

function formatMoney(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function VendorBreakdownCharts({
  paymentMethods,
  ordersByStatus,
  topProducts,
}: VendorBreakdownChartsProps) {
  const paymentData = paymentMethods.map((item) => ({
    name: item.method,
    orders: item.orderCount,
    amount: item.amountCents,
  }));

  const statusData = ordersByStatus.map((item) => ({
    name: item.status,
    orders: item.orderCount,
  }));

  const productData = topProducts.map((item) => ({
    name: item.title,
    revenue: item.revenueCents,
    units: item.unitsSold,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Payment methods */}
      <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
        <div className="mb-5">
          <h2 className="text-[15px] font-extrabold text-campus-ink">
            Payment methods
          </h2>
          <p className="mt-1 text-[11px] text-campus-muted">
            Orders by payment method.
          </p>
        </div>

        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={paymentData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#eeeeee"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value, name) =>
                  name === "amount"
                    ? formatMoney(Number(value))
                    : `${Number(value)} orders`
                }
              />

              <Bar
                dataKey="orders"
                fill="#f15a24"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {paymentData.length === 0 ? (
          <p className="py-8 text-center text-xs text-campus-subtle">
            No payment data yet.
          </p>
        ) : null}
      </section>

      {/* Orders by status */}
      <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
        <div className="mb-5">
          <h2 className="text-[15px] font-extrabold text-campus-ink">
            Orders by status
          </h2>
          <p className="mt-1 text-[11px] text-campus-muted">
            Current order status breakdown.
          </p>
        </div>

        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#eeeeee"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) =>
                  `${Number(value)} orders`
                }
              />

              <Bar
                dataKey="orders"
                fill="#f15a24"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {statusData.length === 0 ? (
          <p className="py-8 text-center text-xs text-campus-subtle">
            No order status data yet.
          </p>
        ) : null}
      </section>

      {/* Top products */}
      <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
        <div className="mb-5">
          <h2 className="text-[15px] font-extrabold text-campus-ink">
            Top products
          </h2>
          <p className="mt-1 text-[11px] text-campus-muted">
            Best-performing products by revenue.
          </p>
        </div>

        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productData}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#eeeeee"
                horizontal={false}
              />

              <XAxis
                type="number"
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) =>
                  `R${value / 100}`
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value, name) =>
                  name === "revenue"
                    ? formatMoney(Number(value))
                    : `${Number(value)} units`
                }
              />

              <Bar
                dataKey="revenue"
                fill="#f15a24"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {productData.length === 0 ? (
          <p className="py-8 text-center text-xs text-campus-subtle">
            No product data yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}