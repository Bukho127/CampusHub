import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { requestAdminStepUp } from "../api/adminStepUp";

type User = { _id: string; displayName: string; email: string; role: "user" | "vendor" | "admin"; status: "active" | "banned"; vendorVerificationStatus: string; emailVerified: boolean; createdAt: string };
type PageResponse = { users: User[] };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await apiClient.get<{ data: PageResponse; meta?: { totalPages: number } }>("/admin/users", { params: { page, limit: 20, ...(query ? { q: query } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}) } });
      setUsers(data.data.users); setTotalPages(data.meta?.totalPages ?? 1);
    } catch { setError("Could not load users."); }
    finally { setLoading(false); }
  }, [page, query, role, status]);
  useEffect(() => { void load(); }, [load]);

  async function changeStatus(user: User) {
    if (!(await requestAdminStepUp(setError))) return;
    if (user.status === "banned") {
      try { await apiClient.patch(`/admin/users/${user._id}/status`, { status: "active" }); await load(); }
      catch { setError(`Could not unban ${user.displayName}.`); }
      return;
    }
    const banReason = window.prompt(`Reason for banning ${user.displayName}?`);
    if (!banReason?.trim()) return;
    try { await apiClient.patch(`/admin/users/${user._id}/status`, { status: "banned", banReason: banReason.trim() }); await load(); }
    catch { setError(`Could not ban ${user.displayName}.`); }
  }
  async function removeUser(user: User) {
    if (!window.confirm(`Delete ${user.displayName}'s account? Their account will be disabled and sessions revoked.`)) return;
    if (!(await requestAdminStepUp(setError))) return;
    try { await apiClient.delete(`/admin/users/${user._id}`); await load(); }
    catch { setError(`Could not delete ${user.displayName}.`); }
  }

  return <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9"><p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">ADMIN WORKSPACE</p><h1 className="mb-2 text-3xl font-extrabold tracking-tight text-campus-ink">Users</h1><p className="mb-6 text-sm text-campus-muted">Search accounts, review roles, and manage user access.</p>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="mb-4 flex flex-wrap gap-2"><form className="flex min-w-[220px] flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}><input className="min-w-0 flex-1 rounded-lg border border-campus-line bg-white px-3 py-2 text-sm" aria-label="Search by name or email" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="rounded-lg bg-campus-accent px-4 py-2 text-sm font-bold text-white">Search</button></form><select className="rounded-lg border border-campus-line bg-white px-3 py-2 text-sm" aria-label="Filter role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option><option value="user">User</option><option value="vendor">Vendor</option><option value="admin">Admin</option></select><select className="rounded-lg border border-campus-line bg-white px-3 py-2 text-sm" aria-label="Filter status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Active & banned</option><option value="active">Active</option><option value="banned">Banned</option></select></div>
    <div className="overflow-x-auto rounded-xl border border-campus-line bg-campus-surface"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-campus-background text-campus-muted"><tr>{["Account", "Role", "Verification", "Joined", "Status", "Actions"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user._id} className="border-t border-campus-line"><td className="px-4 py-3"><strong className="block text-campus-ink">{user.displayName}</strong><span className="mt-1 block text-campus-muted">{user.email}</span></td><td className="px-4 py-3 capitalize">{user.role}</td><td className="px-4 py-3">{user.role === "vendor" ? user.vendorVerificationStatus : user.emailVerified ? "Email verified" : "Email unverified"}</td><td className="px-4 py-3 text-campus-muted">{new Date(user.createdAt).toLocaleDateString("en-ZA")}</td><td className="px-4 py-3 capitalize">{user.status}</td><td className="px-4 py-3"><div className="flex gap-2">{user.role !== "admin" && <><button onClick={() => void changeStatus(user)} className="rounded-md border border-campus-line px-2.5 py-1.5 font-semibold">{user.status === "banned" ? "Unban" : "Ban"}</button><button onClick={() => void removeUser(user)} className="rounded-md border border-red-200 px-2.5 py-1.5 font-semibold text-red-700">Delete</button></>}</div></td></tr>)}</tbody></table>{loading && <p className="px-5 py-8 text-center text-xs text-campus-muted">Loading users…</p>}{!loading && users.length === 0 && <p className="px-5 py-8 text-center text-xs text-campus-muted">No users match these filters.</p>}<div className="flex items-center justify-between border-t border-campus-line px-4 py-3"><span className="text-[11px] text-campus-muted">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-campus-line px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-campus-line px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div></div>
  </section>;
}
