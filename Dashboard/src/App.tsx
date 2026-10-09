import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import RequireAuth from "./components/RequireAuth";
import { useAuth } from "./contexts/AuthContext";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const VendorOrdersPage = lazy(() => import("./pages/VendorOrdersPage"));
const VendorListingsPage = lazy(() => import("./pages/VendorListingsPage"));
const VendorEarningsPage = lazy(() => import("./pages/VendorEarningsPage"));
const VendorPostsPage = lazy(() => import("./pages/VendorAccountPages").then((module) => ({ default: module.VendorPostsPage })));
const VendorProfilePage = lazy(() => import("./pages/VendorAccountPages").then((module) => ({ default: module.VendorProfilePage })));
const VendorReviewsPage = lazy(() => import("./pages/VendorAccountPages").then((module) => ({ default: module.VendorReviewsPage })));
const AwaitingVerificationPage = lazy(() => import("./pages/AwaitingVerificationPage"));
const AdminOverviewPage = lazy(() => import("./pages/AdminOverviewPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminVendorsPage = lazy(() => import("./pages/AdminVendorsPage"));
const AdminListingsPage = lazy(() => import("./pages/AdminModerationPages").then((module) => ({ default: module.AdminListingsPage })));
const AdminReportsPage = lazy(() => import("./pages/AdminModerationPages").then((module) => ({ default: module.AdminReportsPage })));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminAuditPage = lazy(() => import("./pages/AdminAuditPage"));
const AdminCommunityPage = lazy(() => import("./pages/AdminCommunityPage"));
const AdminInstitutionsPage = lazy(() => import("./pages/AdminOperationsPages").then((module) => ({ default: module.AdminInstitutionsPage })));
const AdminPollsPage = lazy(() => import("./pages/AdminOperationsPages").then((module) => ({ default: module.AdminPollsPage })));
const AdminFraudPage = lazy(() => import("./pages/AdminSystemPages").then((module) => ({ default: module.AdminFraudPage })));
const AdminHealthPage = lazy(() => import("./pages/AdminSystemPages").then((module) => ({ default: module.AdminHealthPage })));
const AdminPromotionsPage = lazy(() => import("./pages/AdminSystemPages").then((module) => ({ default: module.AdminPromotionsPage })));
const AdminReviewsPage = lazy(() => import("./pages/AdminReviewsPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-campus-background text-sm text-campus-muted">
        Loading your account…
      </div>
    );
  }

  if (user) return <Navigate to={`/${user.role}/overview`} replace />;

  return <LoginPage />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-campus-background text-sm text-campus-muted">
        Loading your account…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={`/${user.role}/overview`} replace />;
}

function DashboardSection() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-9">
      <p className="mb-2 text-[10px] font-extrabold tracking-[1.1px] text-campus-accent">
        COMMUNITY STORE
      </p>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-campus-ink">
        Page setup in progress
      </h1>
      <p className="text-[13px] leading-6 text-campus-muted">
        This section will be connected in a later dashboard step.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-campus-muted">Loading dashboard page…</div>}>
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route element={<RequireAuth role="vendor" />}>
        <Route path="/vendor" element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="earnings" element={<VendorEarningsPage />} />
          <Route path="listings" element={<VendorListingsPage />} />
          <Route path="reviews" element={<VendorReviewsPage />} />
          <Route path="community-posts" element={<VendorPostsPage />} />
          <Route path="profile" element={<VendorProfilePage />} />
          <Route path=":section" element={<DashboardSection />} />
          <Route path="awaiting-verification" element={<AwaitingVerificationPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth role="admin" />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="verification" element={<AdminVendorsPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="moderation" element={<AdminReportsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="escrow" element={<AdminOrdersPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="bulletins" element={<AdminCommunityPage />} />
          <Route path="institutions" element={<AdminInstitutionsPage />} />
          <Route path="polls" element={<AdminPollsPage />} />
          <Route path="fraud" element={<AdminFraudPage />} />
          <Route path="health" element={<AdminHealthPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path=":section" element={<DashboardSection />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
