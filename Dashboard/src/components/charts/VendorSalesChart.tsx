import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MonthlySales } from "../../api/vendorAnalytics";

type SalesMode = "revenue" | "orders";

interface VendorSalesChartProps {
  data: MonthlySales;
  mode: SalesMode;
  onModeChange: (mode: SalesMode) => void;
  onYearChange: (year: number) => void;
}

function formatMoney(value: number) {
  return `R ${(value / 100).toLocaleString("en-ZA", {
    maximumFractionDigits: 0
  })}`;
}

export default function VendorSalesChart({
  data,
  mode,
  onModeChange,
  onYearChange
}: VendorSalesChartProps) {
  const chartData = data.months.map((month, index) => ({
    label: month.label,
    current:
      mode === "revenue" ? month.revenueCents / 100 : month.orderCount,
    previous:
      mode === "revenue"
        ? (data.previousYearMonths[index]?.revenueCents ?? 0) / 100
        : data.previousYearMonths[index]?.orderCount ?? 0
  }));

  return (
    <section className="rounded-xl border border-campus-line bg-campus-surface p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-campus-ink">
            Sales by month
          </h2>
          <p className="mt-1 text-[11px] text-campus-muted">
            Compare this year with {data.previousYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-campus-line bg-white px-2.5 py-2 text-xs text-campus-ink"
            value={data.year}
            onChange={(event) => onYearChange(Number(event.target.value))}
            aria-label="Select sales year"
          >
            {[data.year - 1, data.year, data.year + 1].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <div className="flex rounded-lg border border-campus-line p-1">
            {(["revenue", "orders"] as const).map((option) => (
              <button
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${
                  mode === option
                    ? "bg-campus-accent-soft text-campus-accent"
                    : "text-campus-muted"
                }`}
                key={option}
                onClick={() => onModeChange(option)}
                type="button"
              >
                {option === "revenue" ? "Revenue" : "Orders"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eeeeee" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#656565", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#656565", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => mode === "revenue" ? `R${value}` : String(value)}
            />
            <Tooltip
              formatter={(value) =>
                mode === "revenue"
                  ? formatMoney(Number(value) * 100)
                  : `${Number(value)} orders`
              }
            />
            <Bar dataKey="current" fill="#f15a24" radius={[4, 4, 0, 0]} />
            <Line dataKey="previous" stroke="#9b9b9b" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}