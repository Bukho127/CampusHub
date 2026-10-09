import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "../api/client";
import { requestAdminStepUp } from "../api/adminStepUp";

type Vendor = { _id: string; displayName: string; email: string; location?: string; vendorVerificationStatus: "unverified" | "pending" | "verified"; emailVerified: boolean; campusEmailVerificationStatus?: string; createdAt: string };

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await apiClient.get<{ data: { vendors: Vendor[] }; meta?: { totalPages: number } }>("/admin/vendors", { params: { status, page, limit: 20 } });
      setVendors(data.data.vendors); setTotalPages(data.meta?.totalPages ?? 1);
    } catch { setError("Could not load vendor applications."); }
    finally { setLoading(false); }
  }, [page, status]);
  useEffect(() => { void load(); }, [load]);
  async function decide(vendor: Vendor, nextStatus: "verified" | "unverified") {
    if (workingId) return;
    const action = nextStatus === "verified" ? "approve" : "reject";
    if (!window.confirm(`${action === "approve" ? "Approve" : "Reject"} ${vendor.displayName}'s vendor application?`)) return;
    setWorkingId(vendor._id);
    setError("");
    try {
      if (!(await requestAdminStepUp(setError))) return;
      await apiClient.patch(`/admin/users/${vendor._id}/verification`, { vendorVerificationStatus: nextStatus });
      await load();
    } catch (requestError: unknown) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data.message ?? `Could not ${action} this application.`
        : `Could not ${action} this application.`);
    } finally {
      setWorkingId(null);
    }
  }
  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9"><p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">ADMIN WORKSPACE</p><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold tracking-tight text-campus-ink">Vendor verification</h1><p className="mt-2 text-sm text-campus-muted">Review vendor applications and set their verification status.</p></div><select className="rounded-lg border border-campus-line bg-white px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter vendor verification status"><option value="pending">Pending</option><option value="verified">Verified</option><option value="unverified">Unverified</option></select></div>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-campus-line bg-campus-surface"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-campus-background text-campus-muted"><tr>{["Vendor", "Location", "Email checks", "Applied", "Status", "Decision"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{vendors.map((vendor) => <tr key={vendor._id} className="border-t border-campus-line"><td className="px-4 py-3"><strong className="block text-campus-ink">{vendor.displayName}</strong><span className="mt-1 block text-campus-muted">{vendor.email}</span></td><td className="px-4 py-3">{vendor.location || "—"}</td><td className="px-4 py-3">Account: {vendor.emailVerified ? "verified" : "unverified"}<br />Campus: {vendor.campusEmailVerificationStatus ?? "unverified"}</td><td className="px-4 py-3">{new Date(vendor.createdAt).toLocaleDateString("en-ZA")}</td><td className="px-4 py-3 capitalize">{vendor.vendorVerificationStatus}</td><td className="px-4 py-3"><div className="flex gap-2">{vendor.vendorVerificationStatus !== "verified" && <button onClick={() => void decide(vendor, "verified")} className="rounded-md bg-campus-accent px-3 py-2 font-bold text-white">Approve</button>}{vendor.vendorVerificationStatus !== "unverified" && <button onClick={() => void decide(vendor, "unverified")} className="rounded-md border border-campus-line px-3 py-2 font-semibold">Reject / revoke</button>}</div></td></tr>)}</tbody></table>{loading && <p className="px-5 py-8 text-center text-xs text-campus-muted">Loading vendors…</p>}{!loading && vendors.length === 0 && <p className="px-5 py-8 text-center text-xs text-campus-muted">No vendors in this status.</p>}<div className="flex items-center justify-between border-t border-campus-line px-4 py-3"><span className="text-[11px] text-campus-muted">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-campus-line px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-campus-line px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div></div>
  </section>;
}
