import axios from "axios";
import { apiClient } from "./client";

let verifiedUntil = 0;

export function resetAdminStepUp() {
  verifiedUntil = 0;
}

export async function requestAdminStepUp(onError?: (message: string) => void) {
  if (Date.now() < verifiedUntil) return true;
  const password = window.prompt("Enter your sign-in password to confirm this admin action. Verification lasts five minutes.");
  if (!password) return false;
  try {
    await apiClient.post("/auth/step-up", { password });
    verifiedUntil = Date.now() + 4 * 60 * 1000;
    return true;
  } catch (error: unknown) {
    resetAdminStepUp();
    const message = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data.message ?? "Could not confirm your password. Please try again."
      : "Could not confirm your password. Please try again.";
    if (onError) onError(message);
    else window.alert(message);
    return false;
  }
}
