import { createContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { api } from "../../api/client";
import type { ApiError } from "../../api/client";
import type { AuthContextValue, AuthSession, AuthUser } from "./auth.types";

const AUTH_STORAGE_KEY = "cryptosage.auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const initialSession = typeof window !== "undefined" ? readStoredSession() : null;
  const [user, setUser] = useState<AuthUser | null>(initialSession?.user ?? null);
  const [token, setToken] = useState<string | null>(initialSession?.token ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.setToken(token);
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      writeStoredSession(null);
    };

    window.addEventListener("cs:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("cs:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (!active) return;
        setUser(me.data);
        writeStoredSession({ token, user: me.data });
      } catch {
        if (!active) return;
        setUser(null);
        setToken(null);
        writeStoredSession(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [token]);

  async function login(email: string, password: string) {
    const response = await api.login({ email, password });
    const session: AuthSession = response.data;
    setToken(session.token);
    setUser(session.user);
    writeStoredSession(session);
  }

  async function register(name: string, email: string, password: string) {
    await api.register({ name, email, password });
    await login(email, password);
  }

  function logout() {
    setUser(null);
    setToken(null);
    writeStoredSession(null);
  }

  async function refreshUser() {
    if (!token) return;

    const me = await api.getMe();
    setUser(me.data);
    writeStoredSession({ token, user: me.data });
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const maybeError = error as { response?: { data?: ApiError } ; message?: string };
    const message = maybeError.response?.data?.error?.message;
    if (message) return message;
    if (maybeError.message) return maybeError.message;
  }

  return fallback;
}
