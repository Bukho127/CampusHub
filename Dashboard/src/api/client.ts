import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "https://campushub-backend-bukho-20261009.azurewebsites.net/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 401) {
      const isPasswordConfirmationFailure =
        error.config?.url?.split("?")[0]?.endsWith("/auth/step-up") &&
        error.response.data.message === "Password verification failed";
      if (!isPasswordConfirmationFailure) {
        window.dispatchEvent(new Event("campushub:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);
