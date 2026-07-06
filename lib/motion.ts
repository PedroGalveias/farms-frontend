// App-level motion preference.
//
// By default every animation honours `prefers-reduced-motion`. But that media
// query is driven by an OS setting (Windows "Animation effects", macOS "Reduce
// motion") that many people have off without knowing — and then the whole app
// looks frozen "for no reason" in every browser on that machine. This module
// adds an explicit per-device override: when the user opts in to animations
// (via the command palette), we set `html.force-motion` and treat reduced
// motion as off.
//
// The class is applied pre-hydration by the inline bootstrap in app/layout.tsx
// (same pattern as the theme class) so there's no flash of frozen UI.

export const MOTION_STORAGE_KEY = "farms.motion";
/** Fired on window whenever the override changes, so live animation loops
 *  (GlassLight, the WebGL hero) can restart without a reload. */
export const MOTION_EVENT = "farms:motion";

/** Whether the user has explicitly forced animations on for this device. */
export function motionForced(): boolean {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

/**
 * The check every animation consumer should use instead of reading the media
 * query directly: OS-level reduced motion, unless the user overrode it.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (motionForced()) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Persist the override, flip the html class, and notify live consumers. */
export function setMotionForced(on: boolean): void {
  try {
    if (on) {
      window.localStorage.setItem(MOTION_STORAGE_KEY, "on");
    } else {
      window.localStorage.removeItem(MOTION_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode) — the class still applies for
    // this page view.
  }
  document.documentElement.classList.toggle("force-motion", on);
  window.dispatchEvent(new Event(MOTION_EVENT));
}
