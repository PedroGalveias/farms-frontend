// The single home for View Transitions logic — both the cross-route navigation
// layer (components/transitions/ViewTransitions) and the quick-search row→sheet
// morph (QuickSearchExperience / FarmDetailSheet) import from here.
//
// The pure decision helpers (isInternalHref / shouldInterceptClick /
// shouldAnimateNavigation) are framework-free so the branchy logic stays
// unit-testable without a real browser (jsdom has no startViewTransition).
import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

/** True for app-internal paths ("/farm/x"), not external or protocol URLs. */
export function isInternalHref(href: string | null | undefined): boolean {
  return (
    typeof href === "string" && href.startsWith("/") && !href.startsWith("//") // protocol-relative → external
  );
}

export interface ClickContext {
  href: string | null | undefined;
  target: string | null | undefined;
  download: boolean;
  /** Mouse button; only a primary (0) click should be hijacked. */
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  /** Current location as pathname + search, to skip no-op navigations. */
  currentUrl: string;
}

/**
 * Whether a link click should be taken over for an animated client navigation.
 * Anything that the browser should handle natively — new tabs, downloads,
 * modified clicks, external links, or navigating to where we already are — is
 * left alone.
 */
export function shouldInterceptClick(context: ClickContext): boolean {
  if (context.defaultPrevented) return false;
  if (context.button !== 0) return false;
  if (
    context.metaKey ||
    context.ctrlKey ||
    context.shiftKey ||
    context.altKey
  ) {
    return false;
  }
  if (context.target && context.target !== "_self") return false;
  if (context.download) return false;
  if (!isInternalHref(context.href)) return false;
  if (context.href === context.currentUrl) return false;
  return true;
}

/** Runtime capability check (feature detection, not UA sniffing). */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as ViewTransitionDocument).startViewTransition ===
      "function"
  );
}

/** Whether the user has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface AnimateOptions {
  supported: boolean;
  reducedMotion: boolean;
}

/**
 * Whether to wrap a navigation in a view transition. Requires platform support
 * and respects the user's reduced-motion preference; otherwise the caller
 * navigates instantly (a pure progressive enhancement).
 */
export function shouldAnimateNavigation(options: AnimateOptions): boolean {
  return options.supported && !options.reducedMotion;
}

/** Supported *and* motion is allowed — the gate for the morph helpers below. */
export function shouldAnimateViewTransitions(): boolean {
  return supportsViewTransitions() && !prefersReducedMotion();
}

/**
 * Run a React state update inside a View Transition so the browser can morph
 * between the old and new DOM (e.g. a result row expanding into a detail
 * sheet). `flushSync` forces the update to apply synchronously so the
 * transition captures the new state. Falls back to a plain update when the API
 * is unavailable or reduced motion is requested.
 *
 * `morphEl` carries the shared `view-transition-name` only in the OLD
 * snapshot: it's named before capture and un-named inside the update, so the
 * new snapshot contains just the destination element. If both kept the name,
 * the browser would see a duplicate view-transition-name and abort the
 * transition ("Transition was aborted because of invalid state").
 */
export function runViewTransition(
  update: () => void,
  morphEl?: HTMLElement | null,
) {
  if (!shouldAnimateViewTransitions()) {
    update();
    return;
  }

  if (morphEl) {
    morphEl.style.viewTransitionName = "qs-farm";
  }

  const transition = (document as ViewTransitionDocument).startViewTransition!(
    () => {
      flushSync(update);
      // Clear before the NEW state is captured — the destination (e.g. the
      // detail sheet) is the only "qs-farm" in the new snapshot.
      if (morphEl) {
        morphEl.style.viewTransitionName = "";
      }
    },
  );

  // Backstop for aborted/skipped transitions.
  transition.finished.finally(() => {
    if (morphEl) {
      morphEl.style.viewTransitionName = "";
    }
  });
}
