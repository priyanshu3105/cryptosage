import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginRequest, SignupRequest, UpgradeGuestRequest, User } from "@/types";
import { apiClient, AUTH_TOKEN_KEY } from "@/services/api";

const USER_STORAGE_KEY = "auth_user";
const SESSION_ERROR = "Could not start a session. Is the API running?";

type AuthSession = { token: string; user: User };

interface SessionState {
  user: User | null;
  isReady: boolean;
  isBusy: boolean;
  error: string | null;
}

interface SessionContextType extends SessionState {
  continueAsGuest: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  upgradeGuest: (data: UpgradeGuestRequest) => Promise<void>;
  logout: () => Promise<void>;
  resetSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

// Shared across StrictMode's double-invoked effects so one page load can never
// create two guest accounts.
let pendingGuest: Promise<AuthSession> | null = null;

function requestGuestSession() {
  if (!pendingGuest) {
    pendingGuest = apiClient.post<AuthSession>("/auth/guest").finally(() => {
      pendingGuest = null;
    });
  }
  return pendingGuest;
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function persistSession(session: AuthSession) {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
}

async function startGuestSession() {
  const session = await requestGuestSession();
  persistSession(session);
  return session.user;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    isReady: false,
    isBusy: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      try {
        if (localStorage.getItem(AUTH_TOKEN_KEY)) {
          try {
            const user = await apiClient.get<User>("/auth/me");
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            if (!cancelled) setState({ user, isReady: true, isBusy: false, error: null });
            return;
          } catch {
            // Token expired or its account is gone — fall through to a new guest.
            clearStoredSession();
          }
        }

        const user = await startGuestSession();
        if (!cancelled) setState({ user, isReady: true, isBusy: false, error: null });
      } catch {
        clearStoredSession();
        if (!cancelled) {
          setState({ user: null, isReady: true, isBusy: false, error: SESSION_ERROR });
        }
      }
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const continueAsGuest = useCallback(async () => {
    setState((s) => ({ ...s, isBusy: true, error: null }));
    try {
      clearStoredSession();
      const user = await startGuestSession();
      setState({ user, isReady: true, isBusy: false, error: null });
      window.location.assign("/portfolio");
    } catch {
      clearStoredSession();
      setState({ user: null, isReady: true, isBusy: false, error: SESSION_ERROR });
      throw new Error(SESSION_ERROR);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, isBusy: true, error: null }));
    try {
      const session = await apiClient.post<AuthSession>("/auth/login", data);
      persistSession(session);
      setState({ user: session.user, isReady: true, isBusy: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, isBusy: false }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    setState((s) => ({ ...s, isBusy: true, error: null }));
    try {
      // If we're already on a guest session, upgrade it so portfolio/journal stay.
      const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      let isGuest = false;
      if (saved) {
        try {
          isGuest = Boolean((JSON.parse(saved) as User).isGuest);
        } catch {
          isGuest = false;
        }
      }

      const session =
        existingToken && isGuest
          ? await apiClient.post<AuthSession>("/auth/upgrade", data)
          : await apiClient.post<AuthSession>("/auth/register", data);

      persistSession(session);
      setState({ user: session.user, isReady: true, isBusy: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, isBusy: false }));
      throw error;
    }
  }, []);

  const upgradeGuest = useCallback(async (data: UpgradeGuestRequest) => {
    setState((s) => ({ ...s, isBusy: true, error: null }));
    try {
      const session = await apiClient.post<AuthSession>("/auth/upgrade", data);
      persistSession(session);
      setState({ user: session.user, isReady: true, isBusy: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, isBusy: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    clearStoredSession();
    setState((s) => ({ ...s, isBusy: true, isReady: false, error: null }));
    try {
      const user = await startGuestSession();
      setState({ user, isReady: true, isBusy: false, error: null });
      window.location.assign("/portfolio");
    } catch {
      setState({ user: null, isReady: true, isBusy: false, error: SESSION_ERROR });
    }
  }, []);

  const resetSession = useCallback(async () => {
    setState((s) => ({ ...s, isReady: false, isBusy: true }));

    try {
      await apiClient.delete("/auth/me");
    } catch {
      // Nothing left to delete server-side; still hand out a fresh session.
    }

    clearStoredSession();

    try {
      await startGuestSession();
    } catch {
      setState({ user: null, isReady: true, isBusy: false, error: SESSION_ERROR });
      return;
    }

    // Portfolio, journal and chat state are all loaded per session id, so a
    // reload is the cheapest way to get every consumer onto the new session.
    window.location.reload();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        continueAsGuest,
        login,
        signup,
        upgradeGuest,
        logout,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
