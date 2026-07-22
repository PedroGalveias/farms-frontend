"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ToastOptions {
  message: string;
  /** Optional leading icon (a lucide icon element). */
  icon?: ReactNode;
}

interface ToastItem extends ToastOptions {
  id: number;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

// Default is a no-op so `useToast()` is safe to call without a provider (e.g.
// in unit tests that render a single component) — it simply does nothing.
const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const VISIBLE_MS = 2600;
const LEAVE_MS = 240;
const MAX_VISIBLE = 3;

// Hydration-safe "has the client taken over" signal: false during SSR and the
// hydration render (matching the server HTML exactly), true on every render
// after. Store-based, so no effect/setState timing is involved.
const emptySubscribe = () => () => {};

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

/**
 * App-wide toast stack — a single, consistent glass confirmation for actions
 * (saved, added to plan, …). Portals to <body>, stacks bottom-centre clear of
 * the mobile tab bar, auto-dismisses, and animates in/out. Providers below it
 * (favourites, trip) fire toasts so every call site gets feedback for free.
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // The portal must NOT render during hydration: the old
  // `typeof document !== "undefined"` guard made the server render null and
  // the client's hydration pass render the portal — a server/client branch
  // mismatch that failed hydration on EVERY page load and made React throw
  // away the whole server-rendered tree and re-render it client-side (heavy
  // enough to matter on iPhones with the full directory loaded). This store
  // reads false during SSR + hydration and true afterwards.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, leaving: true } : item,
      ),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, LEAVE_MS);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      setToasts((current) => [
        ...current.slice(-(MAX_VISIBLE - 1)),
        { ...options, id, leaving: false },
      ]);
      window.setTimeout(() => remove(id), VISIBLE_MS);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8"
            >
              {toasts.map((item) => (
                <div
                  className={`glass glass-chrome pointer-events-auto flex items-center gap-2.5 rounded-chip py-2.5 pl-3.5 pr-5 text-sm font-semibold text-ink shadow-elev-3 ${
                    item.leaving ? "toast-leave" : "toast-enter"
                  }`}
                  key={item.id}
                  role="status"
                >
                  {item.icon ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center text-pine">
                      {item.icon}
                    </span>
                  ) : null}
                  {item.message}
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}
