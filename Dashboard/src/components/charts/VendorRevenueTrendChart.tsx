import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { RevenueTrend } from "../../api/vendorAnalytics";

interface VendorRevenueTrendChartProps {
  data: RevenueTrend;
  interval: "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  onIntervalChange: (interval: "daily" | "weekly" | "monthly") => void;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
}

export default function VendorRevenueTrendChart({
  data,
  interval,
  from,
  to,
  onIntervalChange,
  onFromChange,
  onToChange
}: VendorRevenueTrendChartProps) {
  const points = data.points.map((point) => ({
    ...point,
    revenue: point.revenueCents / 100
  }));

  return (
    <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-campus-ink">Revenue trend</h2>
          <p className="mt-1 text-[11px] text-campus-muted">
            Revenue grouped by {interval}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["daily", "weekly", "monthly"] as const).map((value) => (
            <button
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${
                interval === value
                  ? "bg-campus-accent-soft text-campus-accent"
                  : "text-campus-muted"
              }`}
              key={value}
              onClick={() => onIntervalChange(value)}
              type="button"
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}

          <label className="text-[10px] text-campus-muted">
            From
            <input
              className="ml-1 rounded-md border border-campus-line px-2 py-1 text-campus-ink"
              type="date"
              value={from}
              max={to}
              onChange={(event) => onFromChange(event.target.value)}
            />
          </label>

          <label className="text-[10px] text-campus-muted">
            To
            <input
              className="ml-1 rounded-md border border-campus-line px-2 py-1 text-campus-ink"
              type="date"
              value={to}
              min={from}
              onChange={(event) => onToChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="vendorRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f15a24" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f15a24" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eeeeee" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#656565", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#656565", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `R${value}`}
            />
            <Tooltip formatter={(value) => `R ${Number(value).toLocaleString("en-ZA")}`} />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="#f15a24"
              strokeWidth={2}
              fill="url(#vendorRevenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}