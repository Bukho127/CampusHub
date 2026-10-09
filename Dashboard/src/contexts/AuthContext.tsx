import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import axios from "axios";
import { apiClient } from "../api/client";
import type { DashboardUser } from "../api/types";

interface AuthContextValue {
  user: DashboardUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => setUser(null), []);

  useEffect(() => {
    apiClient
      .get<{ data: { user: DashboardUser } }>("/auth/me")
      .then((response) => setUser(response.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearUser();
    window.addEventListener("campushub:unauthorized", onUnauthorized);
    return () => window.removeEventListener("campushub:unauthorized", onUnauthorized);
  }, [clearUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ data: { user: DashboardUser } }>(
        "/auth/dashboard/login",
        { email, password }
      );
      setUser(response.data.data.user);
    } catch (error: unknown) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new Error(error.response?.data.message ?? "Could not sign in.");
      }
      throw new Error("Could not sign in. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/dashboard/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}