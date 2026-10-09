import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "../api/client";

type VendorOrder = {
  _id: string;
  amountCents: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  escrowStatus: string;
  createdAt: string;
  receiptNumber?: string;
  buyer?: { displayName: string } | null;
  items: Array<{ title: string; quantity: number }>;
};

type OrdersResponse = {
  data: { orders: VendorOrder[] };
  meta?: { totalPages: number };
};

function messageFor(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data.message ?? "The order request failed."
    : "The order request failed.";
}

function money(cents: number) {
  return "R " + (cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<OrdersResponse>("/vendor/orders", {
        params: { page, limit: 20, ...(status ? { status } : {}) }
      });
      setOrders(response.data.data.orders);
      setTotalPages(response.data.meta?.totalPages ?? 1);
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function openOrder(id: string) {
    try {
      const response = await apiClient.get<{ data: { order: VendorOrder } }>(
        "/vendor/orders/" + id
      );
      setSelectedOrder(response.data.data.order);
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    }
  }

  async function runAction(order: VendorOrder, action: "cash" | "complete") {
    setWorkingId(order._id);
    setError(null);
    try {
      if (action === "cash") {
        await apiClient.post("/vendor/orders/" + order._id + "/mark-cash-received");
      } else {
        await apiClient.patch("/vendor/orders/" + order._id + "/complete");
      }
      await loadOrders();
      if (selectedOrder?._id === order._id) await openOrder(order._id);
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">VENDOR WORKSPACE</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-ink">Orders</h1>
          <p className="mt-2 text-[13px] text-campus-muted">Review order details and update fulfilment status.</p>
        </div>
        <label className="grid gap-1 text-[11px] font-semibold text-campus-muted">
          Filter by status
          <select className="min-w-40 rounded-lg border border-campus-line bg-white px-3 py-2 text-xs text-campus-ink" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All orders</option>
            {["pending", "confirmed", "processing", "ready", "completed", "cancelled", "refunded"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-campus-line bg-campus-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-campus-background text-campus-muted"><tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Buyer</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>{orders.map((order) => (
              <tr className="border-t border-campus-line" key={order._id}>
                <td className="px-4 py-3">
                  <button className="font-bold text-campus-accent hover:underline" onClick={() => void openOrder(order._id)} type="button">
                    {order.receiptNumber ?? order._id.slice(-8).toUpperCase()}
                  </button>
                </td>
                <td className="px-4 py-3">{order.buyer?.displayName ?? "Buyer"}</td>
                <td className="px-4 py-3 text-campus-muted">{new Date(order.createdAt).toLocaleDateString("en-ZA")}</td>
                <td className="px-4 py-3 capitalize">{order.paymentMethod}</td>
                <td className="px-4 py-3 capitalize">{order.status}</td>
                <td className="px-4 py-3 text-right font-semibold">{money(order.amountCents)}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  {order.paymentMethod === "cash" && order.paymentStatus === "pending" ? (
                    <button className="rounded-md border border-campus-line px-2 py-1.5 text-[10px] font-semibold hover:border-campus-accent disabled:opacity-50" disabled={workingId === order._id} onClick={() => void runAction(order, "cash")} type="button">Cash received</button>
                  ) : null}
                  {order.paymentStatus === "paid" && order.status !== "completed" ? (
                    <button className="rounded-md bg-campus-accent px-2 py-1.5 text-[10px] font-bold text-white hover:bg-orange-700 disabled:opacity-50" disabled={workingId === order._id} onClick={() => void runAction(order, "complete")} type="button">Complete</button>
                  ) : null}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {loading ? <p className="px-5 py-9 text-center text-xs text-campus-muted">Loading orders…</p> : null}
          {!loading && orders.length === 0 ? <p className="px-5 py-9 text-center text-xs text-campus-subtle">No orders found.</p> : null}
        </div>
        <div className="flex items-center justify-between border-t border-campus-line px-4 py-3">
          <span className="text-[11px] text-campus-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-campus-line px-3 py-2 text-[11px] disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <button className="rounded-lg border border-campus-line px-3 py-2 text-[11px] disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onClick={() => setSelectedOrder(null)}>
          <aside className="h-full w-full max-w-[440px] overflow-y-auto bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label="Order details" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-campus-ink">Order details</h2>
              <button className="rounded-md px-2 py-1 text-campus-muted hover:bg-campus-background" onClick={() => setSelectedOrder(null)} type="button" aria-label="Close order details">✕</button>
            </div>
            <p className="text-xs text-campus-muted">Receipt</p>
            <p className="mb-4 break-all font-bold text-campus-ink">{selectedOrder.receiptNumber ?? selectedOrder._id}</p>
            <p className="mb-1 text-xs text-campus-muted">Buyer</p>
            <p className="mb-4 text-sm font-semibold text-campus-ink">{selectedOrder.buyer?.displayName ?? "Buyer"}</p>
            <p className="mb-2 text-xs font-bold text-campus-ink">Items</p>
            <div className="divide-y divide-campus-line rounded-lg border border-campus-line px-3">
              {selectedOrder.items.map((item, index) => (
                <div className="flex justify-between gap-3 py-3 text-xs" key={item.title + index}>
                  <span>{item.title}</span><span className="shrink-0 text-campus-muted">× {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-campus-line pt-4 text-sm">
              <span className="text-campus-muted">Total</span><strong>{money(selectedOrder.amountCents)}</strong>
            </div>
            <p className="mt-4 text-xs capitalize text-campus-muted">Payment: {selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}</p>
            <p className="mt-2 text-xs capitalize text-campus-muted">Escrow: {selectedOrder.escrowStatus}</p>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
