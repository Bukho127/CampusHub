import { Platform } from "react-native";

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function defaultBaseUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }

  return "http://localhost:5000/api";
}

export const API_BASE_URL = (envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : defaultBaseUrl()).replace(/\/$/, "");

export function toAbsoluteApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const origin = API_BASE_URL.replace(/\/api$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
