import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import campusLogo from "../../../assets/campus-logo.png";

const navigationIconPaths: Record<string, string> = {
  overview: "M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",
  orders: "M5 7h14l1 14H4L5 7z M9 7V5a3 3 0 0 1 6 0v2 M3 7h18",
  earnings: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  listings: "M20.5 13.5 13 21l-10-10V3h8l9.5 10.5z M7 7h.01",
  reviews: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z",
  "community-posts": "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z",
  profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "awaiting-verification": "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4",
  users: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M20 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  verification: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4",
  moderation: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12h6",
  bulletins: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z",
  escrow: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M8 12h8",
  fraud: "M12 9v4 M12 17h.01 M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  promotions: "M20.5 13.5 13 21l-10-10V3h8l9.5 10.5z M7 7h.01 M15 9l-5 5",
  polls: "M4 19V5 M4 19h17 M8 15v-4 M13 15V7 M18 15V3",
  institutions: "M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-5h6v5 M8 10h.01 M12 10h.01 M16 10h.01",
  health: "M22 12h-4l-3 9L9 3l-3 9H2",
  audit: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 2.8-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.2l-.1-.2a1.7 1.7 0 0 0-1.6-1l-.2.1-2.8-1.6.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.2l.2-.1a1.7 1.7 0 0 0 1-1.6l-.1-.2 1.6-2.8.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.2l.1.2a1.7 1.7 0 0 0 1.6 1l.2-.1 2.8 1.6-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1v3.2z"
};

function NavigationIcon({ name }: { name: string }) {
  return <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24">
    <path d={navigationIconPaths[name] ?? navigationIconPaths.overview} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>;
}

function SignOutIcon() {
  return <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
    <path d="M10 17l5-5-5-5M15 12H3m9-9h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>;
}

const vendorNavigation = [
  ["overview", "Overview"],
  ["orders", "Orders"],
  ["earnings", "Earnings"],
  ["listings", "Listings"],
  ["reviews", "Reviews"],
  ["community-posts", "Community posts"],
  ["profile", "Business profile"]
] as const;

const adminNavigation = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["verification", "Vendor verification"],
  ["listings", "Listings"],
  ["moderation", "Moderation"],
  ["reviews", "Review moderation"],
  ["bulletins", "Community posts"],
  ["orders", "Orders & payments"],
  ["escrow", "Escrow"],
  ["fraud", "Fraud alerts"],
  ["promotions", "Promotions"],
  ["polls", "Polls & surveys"],
  ["institutions", "Institutions"],
  ["health", "System health"],
  ["audit", "Audit log"],
  ["settings", "Settings"]
] as const;

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isPendingVendor =
  user.role === "vendor" && user.vendorVerificationStatus !== "verified";

const navigation = isPendingVendor ? ([["awaiting-verification", "Verification status"]] as const): user.role === "admin" ? adminNavigation : vendorNavigation;
  const roleName = user.role === "admin" ? "Administrator" : "Vendor";
  const initials = user.displayName.slice(0, 1).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-campus-background text-campus-ink">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[248px] flex-col border-r border-campus-line bg-campus-surface px-4 py-6 max-md:w-[68px] max-md:px-2">
        <a
          className="mb-8 flex items-center gap-3 px-2 text-inherit no-underline max-md:justify-center max-md:px-0"
          href={`/${user.role}/overview`}
        >
          <img
            alt="CampusHub"
            className="h-10 w-10 shrink-0 object-contain"
            src={campusLogo}
          />
          <span className="max-md:hidden">
            <strong className="block text-sm">CampusHub</strong>
            <small className="mt-1 block text-[11px] text-campus-muted">
              Community Store
            </small>
          </span>
        </a>

        <div className="mb-3 px-3 text-[10px] font-extrabold tracking-[1px] text-campus-subtle max-md:hidden">
          {roleName.toUpperCase()} WORKSPACE
        </div>

        <nav aria-label="Main navigation" className="grid gap-1">
          {navigation.map(([path, label], index) => (
            <NavLink
              className={({ isActive }) =>
                `flex h-[42px] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold no-underline transition max-md:justify-center max-md:px-0 ${
                  isActive
                    ? "bg-campus-accent-soft text-campus-accent"
                    : "text-campus-muted hover:bg-campus-background hover:text-campus-ink"
                }`
              }
              key={path}
              to={`/${user.role}/${path}`}
              end={index === 0}
              title={label}
            >
              <NavigationIcon name={path} />
              <span className="max-md:hidden">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-campus-line px-1 pt-4 max-md:justify-center max-md:px-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-[13px] font-extrabold text-orange-900">
            {initials}
          </div>
          <div className="min-w-0 flex-1 max-md:hidden">
            <strong className="block truncate text-xs">{user.displayName}</strong>
            <small className="mt-1 block text-[11px] text-campus-muted">{roleName}</small>
          </div>
          <button
            className="hidden"
            onClick={handleLogout}
            type="button"
            aria-label="Sign out"
            title="Sign out"
          >
            ↪
          </button>
        </div>
      </aside>

      <main className="ml-[248px] min-h-screen w-[calc(100%-248px)] max-md:ml-[68px] max-md:w-[calc(100%-68px)]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-campus-line bg-campus-surface px-9 max-md:h-[58px] max-md:px-4">
          <div className="text-xs">
            <span className="text-campus-muted">{roleName}</span>
            <span className="mx-2.5 text-campus-subtle">/</span>
            <strong>Dashboard</strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-[11px] text-campus-muted max-sm:hidden">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Signed in
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-xs font-extrabold text-orange-900">
              {initials}
            </div>
            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-campus-line bg-white px-3 text-xs font-bold text-campus-muted transition hover:border-campus-accent hover:text-campus-accent max-sm:px-2"
              onClick={handleLogout}
              type="button"
              aria-label="Sign out"
              title="Sign out"
            >
              <SignOutIcon />
              <span className="max-sm:hidden">Sign out</span>
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
