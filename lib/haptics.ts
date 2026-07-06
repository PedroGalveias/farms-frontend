// Progressive haptic feedback.
//
// - Android (Chrome/Firefox): the Vibration API (navigator.vibrate).
// - iOS/iPadOS: Safari does NOT expose the Vibration API at all. The one
//   web-visible hook is that toggling a native switch control
//   (<input type="checkbox" switch>, iOS 17.4+) fires a real system haptic —
//   so we keep a hidden switch and click it. Must run inside a user gesture,
//   which all our call sites are (save/copy/plan/tab handlers).
// - Anywhere else: a graceful no-op.

let iosSwitch: HTMLInputElement | null = null;
let iosLabel: HTMLLabelElement | null = null;

/** iPhone/iPad detection — iPadOS 13+ masquerades as macOS, so a Mac UA with
 *  a touchscreen counts as iPad. Exported for tests. */
export function isIosLike(nav: {
  userAgent?: string;
  maxTouchPoints?: number;
}): boolean {
  const ua = nav.userAgent ?? "";
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return /macintosh/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1;
}

/**
 * Toggle a hidden iOS switch control — flipping a native
 * `<input type="checkbox" switch>` produces a real system haptic tick on iOS
 * 17.4+ (there is no Vibration API on iOS Safari). Requirements learned the
 * hard way and why the earlier attempt was silent:
 *
 * - The control must actually be *painted*. On-device testing (the
 *   /haptics-lab page) showed a REAL, fully visible switch ticks while a
 *   1×1px-clipped one stays silent — WebKit appears to gate the haptic on
 *   the control genuinely rendering, and clipping it to a pixel (like
 *   `display:none`, `opacity:0` or parking it off-screen) mutes it. So the
 *   switch now sits in-viewport at its natural size, at 2% opacity behind
 *   the content stack (`z-index:-1`, bottom-left corner — under the mobile
 *   tab bar / desktop rail), where it paints but is imperceptible.
 * - We click the INPUT itself — the closest programmatic analogue of the
 *   native toggle that is confirmed to tick.
 * - `.click()` must fire inside the user-gesture window — all our call sites
 *   are pointer/click handlers, so that holds.
 */
function iosSwitchTick(): void {
  try {
    if (!iosSwitch || !iosSwitch.isConnected) {
      iosLabel = document.createElement("label");
      iosLabel.setAttribute("aria-hidden", "true");
      // In-viewport, natural size, painted — opacity low enough to be
      // invisible but NOT zero (zero mutes the haptic).
      iosLabel.style.cssText =
        "position:fixed;bottom:0;left:0;z-index:-1;opacity:0.02;pointer-events:none";
      iosSwitch = document.createElement("input");
      iosSwitch.type = "checkbox";
      iosSwitch.setAttribute("switch", "");
      iosSwitch.tabIndex = -1;
      iosSwitch.style.cssText = "margin:0";
      iosLabel.appendChild(iosSwitch);
      document.body.appendChild(iosLabel);
    }
    // Toggle the switch itself — the state change is what the OS reacts to.
    iosSwitch.click();
  } catch {
    // Best-effort — never let feedback break the action itself.
  }
}

/** A short, light tap — for confirmations like save, copy, or a tab switch. */
export function haptic(durationMs = 10): void {
  if (typeof navigator === "undefined") {
    return;
  }
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(durationMs);
      return;
    } catch {
      // Some browsers throw if vibration is blocked by a permissions policy —
      // fall through to the iOS path (a no-op elsewhere).
    }
  }
  if (typeof document !== "undefined" && isIosLike(navigator)) {
    iosSwitchTick();
  }
}
