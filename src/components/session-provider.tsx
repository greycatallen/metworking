"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { neon } from "@/lib/neon";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

type Status = "loading" | "signed-in" | "signed-out";

interface SessionValue {
  status: Status;
  user: SessionUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Holds the Better Auth session for the whole app.
 *
 * `status` starts as "loading" and is never conflated with "signed-out": the
 * difference is what stops the UI from flashing a sign-in prompt at a user who
 * is in fact signed in, while the session is still being restored.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await neon().auth.getSession();
      const sessionUser = data?.user as SessionUser | undefined;
      if (sessionUser) {
        setUser(sessionUser);
        setStatus("signed-in");
      } else {
        setUser(null);
        setStatus("signed-out");
      }
    } catch {
      // A failed session lookup means "not signed in" as far as the UI cares.
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  const signOut = useCallback(async () => {
    await neon().auth.signOut();
    setUser(null);
    setStatus("signed-out");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, user, refresh, signOut }),
    [status, user, refresh, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
