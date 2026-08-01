"use client";

import { useEffect, type RefObject } from "react";

// Everything the platform treats as tabbable. `[tabindex]` is included so
// custom widgets (the listbox trigger, the sheet grabber) participate, and
// negative tabindex is filtered out below because it is focusable but not
// tabbable.
const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "details > summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]",
  "[tabindex]",
].join(",");

/** The container's tabbable elements, in DOM (tab) order. */
function tabbableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => {
      if (element.hasAttribute("disabled") || element.ariaDisabled === "true") {
        return false;
      }
      if (Number(element.getAttribute("tabindex")) < 0) {
        return false;
      }
      // A zero-size rect catches `display: none` subtrees and collapsed
      // elements.
      //
      // NOTE: it does NOT catch `visibility: hidden` — such elements keep their
      // box and report a real rect, while being untabbable. We accept that:
      // including one is harmless (focus() on it is a no-op and the next Tab
      // moves on), whereas a getComputedStyle call per candidate on every Tab
      // would cost a style recalc for no practical gain. Revisit only if a
      // surface actually hides controls that way.
      const rect = element.getBoundingClientRect();
      return rect.width > 0 || rect.height > 0;
    },
  );
}

/**
 * Keep Tab focus inside an open modal surface (WCAG 2.4.3 Focus Order).
 *
 * `aria-modal="true"` only tells assistive tech that the rest of the page is
 * inert — it does NOT stop the browser tabbing out of the dialog. Without this,
 * a keyboard or screen-reader user tabs straight past the last control into the
 * page behind the overlay, which is visually obscured and often scroll-locked.
 *
 * The native <dialog> + showModal() path (the command palette) gets this from
 * the platform for free; this hook is for the portalled div-based surfaces that
 * can't use it. Pass `active: false` for non-modal presentations — the farm
 * detail DOCK is deliberately non-modal, and trapping focus there would be a
 * bug of its own.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active = true,
) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const root = ref.current;
      if (!root) {
        return;
      }

      const tabbable = tabbableWithin(root);
      if (tabbable.length === 0) {
        // Nothing to focus inside: keep focus from leaving entirely.
        event.preventDefault();
        return;
      }

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const current = document.activeElement;

      // Wrap at both ends, and pull focus back in if it somehow escaped
      // (e.g. the browser restored it to <body> after a re-render). The
      // container itself is also a valid initial focus target for dialogs, so
      // Shift+Tab from it must wrap to the last control rather than escape.
      if (event.shiftKey) {
        if (current === first || current === root || !root.contains(current)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (current === last || !root.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Capture phase: run before any component-level Tab handling.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [ref, active]);
}
