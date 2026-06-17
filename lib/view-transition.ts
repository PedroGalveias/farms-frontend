import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
  };
};

export function supportsViewTransitions() {
  return (
    typeof document !== "undefined" &&
    typeof (document as ViewTransitionDocument).startViewTransition ===
      "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Run a React state update inside a View Transition so the browser can morph
 * between the old and new DOM (e.g. a result row expanding into a detail
 * sheet). `flushSync` forces the update to apply synchronously so the
 * transition captures the new state. Falls back to a plain update when the
 * API is unavailable or reduced motion is requested.
 *
 * `morphEl` is given a shared `view-transition-name` for the duration of the
 * transition, then cleaned up — used to tie the originating element to its
 * destination.
 */
export function runViewTransition(
  update: () => void,
  morphEl?: HTMLElement | null,
) {
  if (!supportsViewTransitions()) {
    update();
    return;
  }

  if (morphEl) {
    morphEl.style.viewTransitionName = "qs-farm";
  }

  const transition = (document as ViewTransitionDocument).startViewTransition!(
    () => flushSync(update),
  );

  transition.finished.finally(() => {
    if (morphEl) {
      morphEl.style.viewTransitionName = "";
    }
  });
}
