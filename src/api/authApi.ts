import { apiRequest } from "./client";
import type { BackendIdentityType, BackendUser } from "./types";

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  identityType: BackendIdentityType;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  const response = await apiRequest<{ user: BackendUser; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await apiRequest<{ user: BackendUser; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function requestPasswordReset(email: string) {
  await apiRequest<null>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(token: string, password: string) {
  await apiRequest<null>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
}

export async function requestCampusEmailVerification(campusEmail: string, token: string) {
  await apiRequest<null>("/users/me/campus-verification", {
    method: "POST",
    token,
    body: JSON.stringify({ campusEmail })
  });
}

export async function verifyCampusEmail(token: string) {
  await apiRequest<{ campusEmailVerified: boolean }>("/auth/verify-campus-email", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getMe(token: string) {
  const response = await apiRequest<{ user: BackendUser }>("/auth/me", { token });
  return response.data.user;
}
