import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

type Overview = { users: number; vendors: number; pendingVendors: number; activeListings: number; openReports: number; orders: number; grossPaidCents: number };
const money = (cents: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiClient.get("/admin/dashboard/overview").then(({ data: response }) => setData(response.data)).catch(() => setError("Could not load platform overview.")); }, []);
  const metrics: Array<[string, string]> = data ? [
    ["Users", data.users.toLocaleString("en-ZA")],
    ["Vendors", data.vendors.toLocaleString("en-ZA")],
    ["Pending vendor reviews", data.pendingVendors.toLocaleString("en-ZA")],
    ["Active listings", data.activeListings.toLocaleString("en-ZA")],
    ["Open reports", data.openReports.toLocaleString("en-ZA")],
    ["Orders", data.orders.toLocaleString("en-ZA")],
    ["Gross paid", money(data.grossPaidCents)]
  ] : [];
  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9"><p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">ADMIN WORKSPACE</p><h1 className="mb-2 text-3xl font-extrabold tracking-tight text-campus-ink">Platform overview</h1><p className="mb-6 text-sm text-campus-muted">Current activity across the CampusHub marketplace.</p>{error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{!data && !error && <p className="text-sm text-campus-muted">Loading platform metrics…</p>}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <article key={label} className="min-h-[120px] rounded-xl border border-campus-line bg-campus-surface p-5"><span className="text-xs font-semibold text-campus-muted">{label}</span><strong className="mt-4 block text-2xl tracking-tight text-campus-ink">{value}</strong></article>)}</div></section>;
}
