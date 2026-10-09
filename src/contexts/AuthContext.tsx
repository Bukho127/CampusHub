import * as SecureStore from "expo-secure-store";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { deleteAccount as deleteAccountApi, getMe, login as loginApi, register as registerApi, type LoginPayload, type RegisterPayload } from "../api/authApi";
import type { BackendUser } from "../api/types";

const tokenStorageKey = "campushub.auth.token";
const userStorageKey = "campushub.auth.user";

type AuthContextValue = {
  user: BackendUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveStoredSession(user: BackendUser, token: string) {
  try {
    await Promise.all([
      SecureStore.setItemAsync(tokenStorageKey, token),
      SecureStore.setItemAsync(userStorageKey, JSON.stringify(user))
    ]);
  } catch (error) {
    console.warn("[auth] Could not persist session", error);
  }
}

async function clearStoredSession() {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(tokenStorageKey),
      SecureStore.deleteItemAsync(userStorageKey)
    ]);
  } catch (error) {
    console.warn("[auth] Could not clear session", error);
  }
}

function parseStoredUser(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as BackendUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [storedToken, storedUserValue] = await Promise.all([
          SecureStore.getItemAsync(tokenStorageKey),
          SecureStore.getItemAsync(userStorageKey)
        ]);
        const storedUser = parseStoredUser(storedUserValue);

        if (!storedToken || !storedUser) {
          await clearStoredSession();
          return;
        }

        if (!active) return;
        setToken(storedToken);
        setUser(storedUser);

        try {
          const freshUser = await getMe(storedToken);
          if (!active) return;
          setUser(freshUser);
          await saveStoredSession(freshUser, storedToken);
        } catch {
          await clearStoredSession();
          if (!active) return;
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.warn("[auth] Could not restore session", error);
        await clearStoredSession();
      } finally {
        if (active) setIsHydrating(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isHydrating,
      login: async (payload) => {
        const result = await loginApi(payload);
        await saveStoredSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
      },
      register: async (payload) => {
        const result = await registerApi(payload);
        await saveStoredSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
      },
      refreshUser: async () => {
        if (!token) return;
        const freshUser = await getMe(token);
        setUser(freshUser);
        await saveStoredSession(freshUser, token);
      },
      logout: () => {
        void clearStoredSession();
        setUser(null);
        setToken(null);
      },
      deleteAccount: async () => {
        if (!token) return;
        await deleteAccountApi(token);
        await clearStoredSession();
        setUser(null);
        setToken(null);
      }
    }),
    [isHydrating, user, token]
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
