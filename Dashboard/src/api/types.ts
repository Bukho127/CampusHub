export type DashboardRole = "admin" | "vendor" | "user";

export interface DashboardUser {
  id: string;
  displayName: string;
  email: string;
  role: DashboardRole;
  identityType: "student" | "faculty" | "resident" | "vendor";
  emailVerified: boolean;
  location?: string;
  vendorVerificationStatus: "unverified" | "pending" | "verified";
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
