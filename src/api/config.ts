import Constants from "expo-constants";
import { Platform } from "react-native";

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const remoteBaseUrl = "https://campushub-backend-bukho-20261009.azurewebsites.net/api";

function getExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri ?? "localhost:8081";
  return hostUri.split(":")[0];
}

function defaultBaseUrl() {
  if (!__DEV__) {
    return remoteBaseUrl;
  }

  const expoHost = getExpoHost();

  if (Platform.OS === "android") {
    return `http://${expoHost === "localhost" ? "10.0.2.2" : expoHost}:5000/api`;
  }

  if (expoHost && expoHost !== "localhost") {
    return `http://${expoHost}:5000/api`;
  }

  return remoteBaseUrl;
}

export const API_BASE_URL = (envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : defaultBaseUrl()).replace(/\/$/, "");

export function toAbsoluteApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const origin = API_BASE_URL.replace(/\/api$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
