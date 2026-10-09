import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardRole } from "../api/types";

export default function RequireAuth({ role }: { role?: DashboardRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-campus-background text-sm text-campus-muted">
        Loading your account…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/overview`} replace />;
  }

  if (user.role === "user" && user.identityType !== "student") {
    return <Navigate to="/login" replace />;
  }

  const isPendingVendor =
    user.role === "vendor" && user.vendorVerificationStatus !== "verified";

  if (
    isPendingVendor &&
    location.pathname !== "/vendor/awaiting-verification"
  ) {
    return <Navigate to="/vendor/awaiting-verification" replace />;
  }

  return <Outlet />;
}
