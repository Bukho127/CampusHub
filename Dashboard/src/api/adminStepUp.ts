import { apiClient } from "./client";

let verifiedUntil = 0;

export async function requestAdminStepUp() {
  if (Date.now() < verifiedUntil) return true;
  const password = window.prompt("Enter your password to confirm this sensitive admin action. Verification lasts five minutes.");
  if (!password) return false;
  await apiClient.post("/auth/step-up", { password });
  verifiedUntil = Date.now() + 4 * 60 * 1000;
  return true;
}
