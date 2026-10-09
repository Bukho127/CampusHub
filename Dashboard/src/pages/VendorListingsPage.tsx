import { useCallback, useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { apiClient } from "../api/client";

type VendorListing = {
  _id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  discountPercent: number;
  condition?: string;
  quantityAvailable?: number;
  location: string;
  status: "active" | "sold" | "draft";
};

type ListingForm = {
  title: string;
  description: string;
  category: string;
  price: string;
  discountPercent: string;
  condition: string;
  quantity: string;
  location: string;
  status: "active" | "draft";
};

const emptyForm: ListingForm = {
  title: "",
  description: "",
  category: "stationery",
  price: "",
  discountPercent: "0",
  condition: "New",
  quantity: "1",
  location: "",
  status: "active"
};

function messageFor(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data.message ?? "The listing request failed."
    : "The listing request failed.";
}

function money(cents: number) {
  return "R " + (cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function VendorListingsPage() {
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VendorListing | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyForm);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{
        data: { listings: VendorListing[] };
        meta?: { totalPages: number };
      }>("/vendor/listings", {
        params: {
          page,
          limit: 20,
          ...(status ? { status } : {}),
          ...(query ? { q: query } : {})
        }
      });
      setListings(response.data.data.listings);
      setTotalPages(response.data.meta?.totalPages ?? 1);
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function newListing() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError(null);
  }

  function editListing(listing: VendorListing) {
    setEditing(listing);
    setForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: (listing.priceCents / 100).toFixed(2),
      discountPercent: String(listing.discountPercent ?? 0),
      condition: listing.condition ?? "New",
      quantity: String(listing.quantityAvailable ?? 1),
      location: listing.location,
      status: listing.status === "draft" ? "draft" : "active"
    });
    setFormOpen(true);
    setError(null);
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      type: "goods",
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priceCents: Math.round(Number(form.price) * 100),
      discountPercent: Number(form.discountPercent),
      condition: form.condition,
      quantityAvailable: Number(form.quantity),
      location: form.location.trim(),
      status: form.status,
      negotiable: false,
      tradeEnabled: false
    };

    try {
      if (editing) {
        await apiClient.patch("/listings/" + editing._id, payload);
      } else {
        await apiClient.post("/listings", payload);
      }
      setFormOpen(false);
      await loadListings();
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function markSold(listing: VendorListing) {
    try {
      await apiClient.patch("/listings/" + listing._id + "/mark-sold");
      await loadListings();
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-campus-line bg-white px-3 py-2.5 text-sm text-campus-ink outline-none focus:border-campus-accent focus:ring-4 focus:ring-campus-accent/10";

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">VENDOR WORKSPACE</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-ink">Listings</h1>
          <p className="mt-2 text-[13px] text-campus-muted">Create and manage products in your campus store.</p>
        </div>
        <button className="rounded-lg bg-campus-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700" onClick={newListing} type="button">
          + Add listing
        </button>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <form
          className="flex min-w-[220px] flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(searchInput.trim());
          }}
        >
          <input className="min-w-0 flex-1 rounded-lg border border-campus-line bg-white px-3 py-2 text-xs outline-none focus:border-campus-accent" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search your listings" aria-label="Search listings" />
          <button className="rounded-lg border border-campus-line bg-white px-3 py-2 text-xs font-semibold" type="submit">Search</button>
        </form>
        <select className="rounded-lg border border-campus-line bg-white px-3 py-2 text-xs" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter listings by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-campus-line bg-campus-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-campus-background text-campus-muted"><tr>
              <th className="px-4 py-3 font-semibold">Listing</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>{listings.map((listing) => (
              <tr className="border-t border-campus-line" key={listing._id}>
                <td className="px-4 py-3"><strong className="block text-campus-ink">{listing.title}</strong><span className="mt-1 block text-[10px] text-campus-muted">{listing.location}</span></td>
                <td className="px-4 py-3 capitalize">{listing.category}</td>
                <td className="px-4 py-3 font-semibold">{listing.discountPercent > 0 ? <><span className="text-campus-accent">{money(Math.round(listing.priceCents * (100 - listing.discountPercent) / 100))}</span><span className="ml-2 text-[10px] text-campus-muted line-through">{money(listing.priceCents)}</span><span className="ml-2 rounded-full bg-campus-accent-soft px-2 py-1 text-[10px] text-campus-accent">-{listing.discountPercent}%</span></> : money(listing.priceCents)}</td>
                <td className="px-4 py-3">{listing.quantityAvailable ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{listing.status}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button className="rounded-md border border-campus-line px-2.5 py-1.5 text-[10px] font-semibold hover:border-campus-accent" onClick={() => editListing(listing)} type="button">Edit</button>
                  {listing.status === "active" ? <button className="rounded-md border border-campus-line px-2.5 py-1.5 text-[10px] font-semibold hover:border-campus-accent" onClick={() => void markSold(listing)} type="button">Mark sold</button> : null}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {loading ? <p className="px-5 py-9 text-center text-xs text-campus-muted">Loading listings…</p> : null}
          {!loading && listings.length === 0 ? <p className="px-5 py-9 text-center text-xs text-campus-subtle">No listings found.</p> : null}
        </div>
        <div className="flex items-center justify-between border-t border-campus-line px-4 py-3">
          <span className="text-[11px] text-campus-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-campus-line px-3 py-2 text-[11px] disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <button className="rounded-lg border border-campus-line px-3 py-2 text-[11px] disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </div>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/30 p-4" role="presentation" onClick={() => setFormOpen(false)}>
          <section className="my-6 max-h-[calc(100vh-3rem)] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={editing ? "Edit listing" : "Create listing"} onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{editing ? "Edit listing" : "New listing"}</h2>
              <button className="rounded-md px-2 py-1 text-campus-muted" onClick={() => setFormOpen(false)} type="button" aria-label="Close">✕</button>
            </div>
            <form className="grid gap-3" onSubmit={saveListing}>
              <label className="text-xs font-semibold">Title<input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} maxLength={140} required /></label>
              <label className="text-xs font-semibold">Description<textarea className={inputClass} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} minLength={10} maxLength={3000} required /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold">Category<select className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{[["stationery", "Stationery"], ["textbooks", "Textbooks"], ["electronics", "Electronics"], ["furniture", "Furniture"], ["food", "Food & Bev"], ["services", "Services"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-semibold">Price (ZAR)<input className={inputClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
                <label className="text-xs font-semibold">Discount (%)<input className={inputClass} type="number" min="0" max="90" step="1" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} /><span className="mt-1 block text-[10px] font-normal text-campus-muted">Enter 0 to remove a discount. Maximum 90%.</span></label>
                <label className="text-xs font-semibold">Condition<select className={inputClass} value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>{["New", "Like New", "Good", "Fair"].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="text-xs font-semibold">Quantity<input className={inputClass} type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></label>
              </div>
              <label className="text-xs font-semibold">Location<input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} maxLength={120} required /></label>
              <label className="text-xs font-semibold">Visibility<select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ListingForm["status"] })}><option value="active">Active</option><option value="draft">Draft</option></select></label>
              <div className="mt-2 flex justify-end gap-2">
                <button className="rounded-lg border border-campus-line px-4 py-2.5 text-xs font-semibold" onClick={() => setFormOpen(false)} type="button">Cancel</button>
                <button className="rounded-lg bg-campus-accent px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Saving…" : editing ? "Save changes" : "Create listing"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
