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

export async function getMe(token: string) {
  const response = await apiRequest<{ user: BackendUser }>("/auth/me", { token });
  return response.data.user;
}
