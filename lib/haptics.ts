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

/** Toggle a hidden iOS switch control — the click produces a system haptic
 *  tick on iOS 17.4+. Harmless (silent) on older iOS. */
function iosSwitchTick(): void {
  try {
    if (!iosSwitch || !iosSwitch.isConnected) {
      iosSwitch = document.createElement("input");
      iosSwitch.type = "checkbox";
      iosSwitch.setAttribute("switch", "");
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.tabIndex = -1;
      iosSwitch.style.cssText =
        "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
      document.body.appendChild(iosSwitch);
    }
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
