import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiClient } from "../api/client";

type Review = { _id: string; rating: number; comment: string; createdAt: string; reviewer?: { displayName?: string }; listing?: { title?: string } };
type Post = { _id: string; title: string; summary: string; body: string; type: "announcement" | "event" | "service"; dateLabel: string; eventDate?: string; eventTime?: string; venue?: string; createdAt: string };
type Profile = { displayName: string; location?: string; email: string; rating?: number; reviewCount?: number; vendorVerificationStatus: string };
type PostForm = Omit<Post, "_id" | "createdAt">;
const emptyPost: PostForm = { title: "", summary: "", body: "", type: "announcement", dateLabel: "Today", eventDate: "", eventTime: "", venue: "" };

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9"><p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">VENDOR PORTAL</p><h1 className="mb-6 text-3xl font-extrabold tracking-tight text-campus-ink">{title}</h1><div className="rounded-2xl border border-campus-border bg-white p-5 shadow-sm">{children}</div></section>;
}

export function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { apiClient.get("/vendor/reviews").then(({ data }) => setReviews(data.data.reviews)).catch(() => setError("Could not load reviews.")); }, []);
  return <Panel title="Customer reviews">{error && <p className="text-red-600">{error}</p>}{reviews.length ? <div className="divide-y divide-campus-border">{reviews.map((review) => <article key={review._id} className="py-4"><div className="flex justify-between gap-3"><strong>{review.reviewer?.displayName ?? "Customer"}</strong><span className="text-campus-accent">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div><p className="mt-1 text-sm text-campus-muted">{review.comment}</p><p className="mt-2 text-xs text-campus-muted">{review.listing?.title ?? "Store review"} · {new Date(review.createdAt).toLocaleDateString()}</p></article>)}</div> : !error && <p className="text-sm text-campus-muted">No reviews yet.</p>}</Panel>;
}

export function VendorPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyPost);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const load = () => apiClient.get("/vendor/community-posts").then(({ data }) => setPosts(data.data.posts)).catch(() => setError("Could not load your community posts."));
  useEffect(() => { void load(); }, []);
  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editingId) await apiClient.patch(`/vendor/community-posts/${editingId}`, form);
      else await apiClient.post("/vendor/community-posts", form);
      setForm(emptyPost); setEditingId(null); await load();
    } catch { setError("Could not save this post. Check the required fields and try again."); }
    finally { setSaving(false); }
  }
  async function removePost(id: string) {
    if (!window.confirm("Delete this community post?")) return;
    try { await apiClient.delete(`/vendor/community-posts/${id}`); await load(); }
    catch { setError("Could not delete this post."); }
  }
  return <Panel title="Community posts"><form onSubmit={savePost} className="mb-6 grid gap-3 rounded-xl bg-campus-background p-4 md:grid-cols-2">
    <h2 className="font-bold md:col-span-2">{editingId ? "Edit post" : "Create a post"}</h2>
    <input required minLength={3} maxLength={140} placeholder="Title" className="rounded-lg border border-campus-border px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <select className="rounded-lg border border-campus-border px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PostForm["type"] })}><option value="announcement">Announcement</option><option value="event">Event</option><option value="service">Service</option></select>
    <input required minLength={10} maxLength={240} placeholder="Short summary" className="rounded-lg border border-campus-border px-3 py-2 md:col-span-2" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
    <textarea required minLength={10} maxLength={4000} placeholder="Post details" className="rounded-lg border border-campus-border px-3 py-2 md:col-span-2" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
    {form.type === "event" && <><input required placeholder="Event date" className="rounded-lg border border-campus-border px-3 py-2" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /><input required placeholder="Event time" className="rounded-lg border border-campus-border px-3 py-2" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} /><input required placeholder="Venue" className="rounded-lg border border-campus-border px-3 py-2 md:col-span-2" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></>}
    <div className="flex gap-2 md:col-span-2"><button disabled={saving} className="rounded-lg bg-campus-accent px-4 py-2 text-sm font-bold text-white">{saving ? "Saving…" : editingId ? "Save changes" : "Publish post"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyPost); }} className="rounded-lg border border-campus-border px-4 py-2 text-sm">Cancel</button>}</div>
  </form>{error && <p className="mb-3 text-sm text-red-600">{error}</p>}{posts.length ? <div className="divide-y divide-campus-border">{posts.map((post) => <article key={post._id} className="py-4"><div className="flex justify-between gap-3"><strong>{post.title}</strong><span className="rounded-full bg-campus-background px-3 py-1 text-xs capitalize text-campus-muted">{post.type}</span></div><p className="mt-2 text-sm text-campus-muted">{post.summary}</p><div className="mt-3 flex gap-3 text-xs"><button onClick={() => { setEditingId(post._id); setForm({ title: post.title, summary: post.summary, body: post.body, type: post.type, dateLabel: post.dateLabel, eventDate: post.eventDate ?? "", eventTime: post.eventTime ?? "", venue: post.venue ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="font-bold text-campus-accent">Edit</button><button onClick={() => void removePost(post._id)} className="font-bold text-red-600">Delete</button><span className="text-campus-muted">{new Date(post.createdAt).toLocaleDateString()}</span></div></article>)}</div> : <p className="text-sm text-campus-muted">You haven’t shared any posts yet.</p>}</Panel>;
}

export function VendorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { apiClient.get("/vendor/profile").then(({ data }) => setProfile(data.data.profile)).catch(() => setNotice("Could not load your profile.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    try { const { data } = await apiClient.patch("/vendor/profile", { displayName: profile.displayName, location: profile.location ?? "" }); setProfile(data.data.profile); setNotice("Profile saved."); }
    catch { setNotice("Could not save your profile. Please try again."); }
  }
  return <Panel title="Store profile">{!profile ? <p className="text-sm text-campus-muted">{notice || "Loading profile…"}</p> : <form className="max-w-xl space-y-4" onSubmit={save}><label className="block text-sm font-semibold text-campus-ink">Store name<input required minLength={2} maxLength={80} className="mt-2 w-full rounded-xl border border-campus-border px-4 py-3 font-normal" value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label><label className="block text-sm font-semibold text-campus-ink">Location<input maxLength={160} className="mt-2 w-full rounded-xl border border-campus-border px-4 py-3 font-normal" value={profile.location ?? ""} onChange={(event) => setProfile({ ...profile, location: event.target.value })} /></label><p className="text-sm text-campus-muted">{profile.email} · {profile.vendorVerificationStatus} · {profile.rating?.toFixed(1) ?? "—"} rating ({profile.reviewCount ?? 0} reviews)</p><button className="rounded-xl bg-campus-accent px-5 py-3 text-sm font-bold text-white">Save profile</button>{notice && <span className="ml-3 text-sm text-campus-muted">{notice}</span>}</form>}</Panel>;
}
