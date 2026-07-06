"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  prefersReducedMotion,
  shouldAnimateNavigation,
  shouldInterceptClick,
  supportsViewTransitions,
} from "@/lib/view-transitions";

interface ViewTransitionsValue {
  /** Navigate to an internal href, animated via the View Transitions API
   *  where supported (and motion is allowed), instant otherwise. */
  navigate: (href: string) => void;
}

const ViewTransitionsContext = createContext<ViewTransitionsValue | null>(null);

/** Guard against a transition that never resolves (e.g. a navigation that
 *  doesn't change the pathname). The platform also self-heals, but this keeps
 *  the snapshot from lingering. */
const FINISH_TIMEOUT_MS = 1200;

export default function ViewTransitions({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // The active transition's "the DOM is updated" resolver, called once the new
  // route has committed (detected via the pathname/search effect below).
  const finishRef = useRef<(() => void) | null>(null);

  const settle = useCallback(() => {
    if (finishRef.current) {
      finishRef.current();
      finishRef.current = null;
    }
  }, []);

  // When the route actually changes, let the pending view transition capture
  // the new state and animate.
  useEffect(() => {
    settle();
  }, [pathname, settle]);

  const navigate = useCallback(
    (href: string) => {
      const reducedMotion = prefersReducedMotion();

      if (
        !shouldAnimateNavigation({
          supported: supportsViewTransitions(),
          reducedMotion,
        })
      ) {
        router.push(href);
        return;
      }

      // Any still-pending transition resolves before we start a new one.
      settle();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            finishRef.current = resolve;
            router.push(href);
            window.setTimeout(settle, FINISH_TIMEOUT_MS);
          }),
      );
    },
    [router, settle],
  );

  // One delegated listener upgrades every internal link to an animated
  // navigation — no need to touch each <Link>. It runs in the *capture* phase
  // so it pre-empts Next's own <Link> click handler; when we take over we stop
  // propagation so the router only navigates once. Native behaviour (new tabs,
  // downloads, modified clicks, external links) is preserved.
  useEffect(() => {
    if (!supportsViewTransitions()) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (
        !shouldInterceptClick({
          href: anchor.getAttribute("href"),
          target: anchor.getAttribute("target"),
          download: anchor.hasAttribute("download"),
          button: event.button,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          defaultPrevented: event.defaultPrevented,
          currentUrl,
        })
      ) {
        return;
      }

      // Pre-empt Next's <Link> handler so navigation happens once, inside the
      // view transition.
      event.preventDefault();
      event.stopPropagation();
      navigate(anchor.getAttribute("href")!);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [navigate]);

  return (
    <ViewTransitionsContext.Provider value={{ navigate }}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}

/** Programmatic animated navigation (e.g. the command palette). Falls back to
 *  a plain push if used outside the provider. */
export function useViewTransitionNavigate(): (href: string) => void {
  const ctx = useContext(ViewTransitionsContext);
  const router = useRouter();
  if (!ctx) return (href: string) => router.push(href);
  return ctx.navigate;
}
