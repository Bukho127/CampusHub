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

export type AvatarUpload = {
  uri: string;
  name: string;
  type: string;
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

export async function requestSchoolEmailCode(email: string, studentNumber: string | undefined, token: string) {
  await apiRequest<null>("/auth/verify/request", {
    method: "POST",
    token,
    body: JSON.stringify({ email, studentNumber })
  });
}

export async function confirmSchoolEmailCode(code: string, token: string) {
  const response = await apiRequest<{ user: BackendUser }>("/auth/verify/confirm", {
    method: "POST",
    token,
    body: JSON.stringify({ code })
  });
  return response.data.user;
}

export async function uploadProfileAvatar(avatar: AvatarUpload, token: string) {
  const formData = new FormData();
  formData.append("avatar", avatar as unknown as Blob);

  const response = await apiRequest<{ user: BackendUser }>("/users/me/avatar", {
    method: "PATCH",
    token,
    body: formData
  });
  return response.data.user;
}

export async function getMe(token: string) {
  const response = await apiRequest<{ user: BackendUser }>("/auth/me", { token });
  return response.data.user;
}
