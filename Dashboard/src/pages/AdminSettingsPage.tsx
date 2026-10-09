import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

type Settings = { settings: Array<{ name: string; value: string }>; management: string };
export default function AdminSettingsPage() {
  const [data, setData] = useState<Settings | null>(null); const [error, setError] = useState("");
  useEffect(() => { apiClient.get<{ data: Settings }>("/admin/settings").then(({ data: response }) => setData(response.data)).catch(() => setError("Could not load the settings summary.")); }, []);
  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9"><p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">ADMIN WORKSPACE</p><h1 className="mb-2 text-3xl font-extrabold tracking-tight text-campus-ink">Settings & security</h1><p className="mb-5 text-sm text-campus-muted">Safe summary of the platform’s current security and operational settings.</p>{error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{data && <><div className="grid gap-3 sm:grid-cols-2">{data.settings.map((item) => <article key={item.name} className="rounded-xl border border-campus-line bg-campus-surface p-5"><span className="text-xs font-semibold text-campus-muted">{item.name}</span><strong className="mt-2 block text-sm text-campus-ink">{item.value}</strong></article>)}</div><p className="mt-5 rounded-xl bg-campus-background p-4 text-sm text-campus-muted">{data.management}</p></>}{!data && !error && <p className="text-sm text-campus-muted">Loading settings…</p>}</section>;
}
