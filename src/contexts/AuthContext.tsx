import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { getMe, login as loginApi, register as registerApi, type LoginPayload, type RegisterPayload } from "../api/authApi";
import type { BackendUser } from "../api/types";

type AuthContextValue = {
  user: BackendUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login: async (payload) => {
        const result = await loginApi(payload);
        setUser(result.user);
        setToken(result.token);
      },
      register: async (payload) => {
        const result = await registerApi(payload);
        setUser(result.user);
        setToken(result.token);
      },
      refreshUser: async () => {
        if (token) setUser(await getMe(token));
      },
      logout: () => {
        setUser(null);
        setToken(null);
      }
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
