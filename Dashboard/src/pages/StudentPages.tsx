import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

type Purchase = {
  _id: string;
  receiptNumber?: string;
  vendor?: { displayName: string } | null;
  amountCents: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number }>;
};

function usePurchases() {
  const [orders, setOrders] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiClient.get<{ data: { orders: Purchase[] } }>("/orders", { signal: controller.signal })
      .then(({ data }) => setOrders(data.data.orders))
      .catch(() => { if (!controller.signal.aborted) setError("Could not load your purchases."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  return { orders, loading, error, retry: () => setAttempt((value) => value + 1) };
}

function StudentSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
    <h1 className="mb-6 text-2xl font-semibold text-campus-ink">{title}</h1>
    {children}
  </section>;
}

function RequestState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p className="py-8 text-sm text-campus-muted" role="status">Loading purchases...</p>;
  if (error) return <div className="flex flex-wrap items-center gap-3 py-6">
    <p className="text-sm text-red-700" role="alert">{error}</p>
    <button type="button" className="text-sm font-medium text-campus-accent hover:underline" onClick={retry}>Try again</button>
  </div>;
  return null;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

export function StudentOverviewPage() {
  const { user } = useAuth();
  const purchases = usePurchases();
  return <StudentSection title={`Welcome, ${user?.displayName ?? "there"}`}>
    <RequestState {...purchases} />
    {!purchases.loading && !purchases.error && <>
      <dl className="grid gap-6 border-y border-campus-line py-6 sm:grid-cols-3">
        {[
          ["Purchases", String(purchases.orders.length)],
          ["In progress", String(purchases.orders.filter((order) => !["completed", "cancelled", "refunded"].includes(order.status)).length)],
          ["Email", user?.emailVerified ? "Verified" : "Unverified"]
        ].map(([label, value]) => <div key={label}><dt className="text-sm text-campus-muted">{label}</dt><dd className="mt-2 text-xl font-medium">{value}</dd></div>)}
      </dl>
      <div className="flex flex-wrap gap-6 py-6 text-sm">
        <Link className="font-medium text-campus-accent hover:underline" to="/user/orders">My purchases</Link>
        <Link className="font-medium text-campus-accent hover:underline" to="/user/profile">My profile</Link>
      </div>
    </>}
  </StudentSection>;
}

export function StudentOrdersPage() {
  const purchases = usePurchases();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(purchases.orders.length / 10));
  const currentPage = Math.min(page, totalPages);
  return <StudentSection title="My purchases">
    <RequestState {...purchases} />
    {!purchases.loading && !purchases.error && (purchases.orders.length ? <>
      <div className="overflow-x-auto border-y border-campus-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-campus-muted"><tr>
            {["Purchase", "Seller", "Date", "Status", "Payment", "Total"].map((title) => <th className="px-3 py-4 font-medium" key={title}>{title}</th>)}
          </tr></thead>
          <tbody>{purchases.orders.slice((currentPage - 1) * 10, currentPage * 10).map((order) => <tr key={order._id} className="border-t border-campus-line">
            <td className="max-w-[240px] px-3 py-4"><p className="break-words font-medium">{order.receiptNumber ?? order._id.slice(-8).toUpperCase()}</p><p className="mt-1 break-words text-xs text-campus-muted">{order.items.map((item) => `${item.title} (${item.quantity})`).join(", ")}</p></td>
            <td className="px-3 py-4">{order.vendor?.displayName ?? "Seller"}</td>
            <td className="whitespace-nowrap px-3 py-4">{new Date(order.createdAt).toLocaleDateString("en-ZA")}</td>
            <td className="px-3 py-4 capitalize">{order.status}</td>
            <td className="px-3 py-4 capitalize">{order.paymentStatus}</td>
            <td className="whitespace-nowrap px-3 py-4 font-medium">{money(order.amountCents)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-campus-muted">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex gap-4">
          <button type="button" className="disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <button type="button" className="disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
        </div>
      </div>
    </> : <p className="py-8 text-sm text-campus-muted">No purchases yet.</p>)}
  </StudentSection>;
}

export function StudentProfilePage() {
  const { user } = useAuth();
  return <StudentSection title="My profile">
    <dl className="max-w-2xl divide-y divide-campus-line border-y border-campus-line">
      {[
        ["Name", user?.displayName],
        ["Email address", user?.email],
        ["Account", "Student"],
        ["Email verification", user?.emailVerified ? "Verified" : "Unverified"],
        ["Location", user?.location || "Not set"]
      ].map(([label, value]) => <div className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]" key={label}><dt className="text-sm text-campus-muted">{label}</dt><dd className="break-words text-sm text-campus-ink">{value}</dd></div>)}
    </dl>
  </StudentSection>;
}
