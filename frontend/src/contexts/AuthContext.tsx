import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, LoginRequest, SignupRequest } from "@/types";
import { apiClient } from "@/services/api";

// Frontend-only demo auth (no backend). Off by default — use real /api auth.
// Set VITE_DEMO_AUTH=true in .env for offline UI work without the API.
const DEMO_AUTH_ENABLED = import.meta.env.VITE_DEMO_AUTH === "false";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    if (DEMO_AUTH_ENABLED) {
      const token = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          setState({ user: parsedUser, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem("auth_user");
        }
      }
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    apiClient
    //sending request to the backend to get the user data
      .get<User>("/auth/me")
      .then((user) => {
        setState({ user, isAuthenticated: true, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        setState({ user: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    if (DEMO_AUTH_ENABLED) {
      const user: User = {
        id: "demo-user",
        email: data.email,
        name: data.email.split("@")[0] || "Demo User",
      };
      localStorage.setItem("auth_token", "demo-token");
      localStorage.setItem("auth_user", JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    try {
      const result = await apiClient.post<{ token: string; user: User }>("/auth/login", data);
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));
      setState({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    if (DEMO_AUTH_ENABLED) {
      const user: User = {
        id: "demo-user",
        email: data.email,
        name: data.name,
      };
      localStorage.setItem("auth_token", "demo-token");
      localStorage.setItem("auth_user", JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    try {
      await apiClient.post<User>("/auth/register", data);
      const result = await apiClient.post<{ token: string; user: User }>("/auth/login", {
        email: data.email,
        password: data.password,
      });
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));
      setState({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  //not needed for now!
  const forgotPassword = useCallback(async (email: string) => {
    if (DEMO_AUTH_ENABLED) return;
    await apiClient.post<void>("/auth/forgot-password", { email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
