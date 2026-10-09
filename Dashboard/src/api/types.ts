export type DashboardRole = "admin" | "vendor";

export interface DashboardUser {
  id: string;
  displayName: string;
  email: string;
  role: DashboardRole;
  vendorVerificationStatus: "unverified" | "pending" | "verified";
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}