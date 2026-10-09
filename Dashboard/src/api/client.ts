import axios from "axios";

const baseURL =
  import.meta.env.DEV ? "/api" :
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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.dispatchEvent(new Event("campushub:unauthorized"));
    }
    return Promise.reject(error);
  }
);
