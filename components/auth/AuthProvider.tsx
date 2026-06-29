"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import AuthModal, { type AuthMode } from "@/components/auth/AuthModal";

interface AuthContextValue {
  user: AuthUser | null;
  /** False until the initial /me check resolves — lets nav avoid a flash. */
  loading: boolean;
  /** Open the auth modal. Optional notice key shown atop the login form. */
  openAuth: (mode?: AuthMode, noticeKey?: string) => void;
  closeAuth: () => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [noticeKey, setNoticeKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user ?? null);
    } catch {
      // Leave the last known state if the check fails.
    } finally {
      setLoading(false);
    }
    // Refresh server-rendered content in case any of it depends on the session.
    router.refresh();
  }, [router]);

  // Hydrate the session once on mount (keeps every route statically rendered;
  // the alternative — reading cookies in the root layout — would force the
  // whole app dynamic).
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { user: AuthUser | null };
        if (active) setUser(data.user ?? null);
      } catch {
        // Treat a failed check as logged-out (state already defaults to null).
      } finally {
        if (active) setLoading(false);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const openAuth = useCallback(
    (nextMode: AuthMode = "login", notice?: string) => {
      setNoticeKey(notice ?? null);
      setMode(nextMode);
    },
    [],
  );

  const closeAuth = useCallback(() => {
    setMode(null);
    setNoticeKey(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie is cleared best-effort by the handler; drop local state anyway.
    }
    setUser(null);
    router.refresh();
  }, [router]);

  // Open the login modal when arriving with ?auth=login (e.g. after verifying
  // an email), then strip the param so a reload doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "login") {
      return;
    }
    queueMicrotask(() => setMode("login"));
    params.delete("auth");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, openAuth, closeAuth, refresh, logout }),
    [user, loading, openAuth, closeAuth, refresh, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        mode={mode}
        noticeKey={noticeKey}
        onClose={closeAuth}
        onSwitch={(next) => setMode(next)}
        onAuthenticated={async (loggedInUser) => {
          if (loggedInUser) {
            // The login response already told us who we are — set it directly
            // and skip the extra /me round-trip.
            setUser(loggedInUser);
            setLoading(false);
            router.refresh();
          } else {
            await refresh();
          }
          closeAuth();
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
