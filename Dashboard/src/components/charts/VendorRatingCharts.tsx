import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type {
  MonthlyRating,
  RatingDistribution
} from "../../api/vendorAnalytics";

interface VendorRatingChartsProps {
  distribution: RatingDistribution[];
  monthlyRatings: MonthlyRating[];
}

export default function VendorRatingCharts({
  distribution,
  monthlyRatings
}: VendorRatingChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
        <h2 className="mb-1 text-[15px] font-extrabold text-campus-ink">
          Rating distribution
        </h2>
        <p className="mb-4 text-[11px] text-campus-muted">
          Reviews grouped by star rating.
        </p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <CartesianGrid stroke="#eeeeee" vertical={false} />
              <XAxis
                dataKey="rating"
                tickFormatter={(value: number) => `${value}★`}
                tick={{ fill: "#656565", fontSize: 11 }}
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
                formatter={(value) => `${Number(value)} reviews`}
                labelFormatter={(value) => `${value} stars`}
              />
              <Bar dataKey="reviewCount" fill="#f15a24" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
        <h2 className="mb-1 text-[15px] font-extrabold text-campus-ink">
          Average rating by month
        </h2>
        <p className="mb-4 text-[11px] text-campus-muted">
          Rolling view of the latest 12 months.
        </p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRatings}>
              <CartesianGrid stroke="#eeeeee" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: "#656565", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)} stars`} />
              <Line
                dataKey="averageRating"
                stroke="#f15a24"
                strokeWidth={2}
                dot={{ fill: "#f15a24", r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}