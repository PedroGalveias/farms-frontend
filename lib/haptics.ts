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
 * - The control must actually be *painted*: `display:none`, `opacity:0`,
 *   `visibility:hidden` AND parking it outside the viewport (`left:-9999px`)
 *   all mute it — WebKit culls off-screen content from painting the same way.
 *   So it sits INSIDE the viewport at 1×1px, tucked behind everything
 *   (`z-index:-1`, bottom corner, overflow hidden) where a single clipped
 *   pixel is imperceptible.
 * - It lives inside a `<label>` and we click the label, mirroring a genuine
 *   user toggle.
 * - `.click()` must fire inside the user-gesture window — all our call sites
 *   are pointer/click handlers, so that holds.
 */
function iosSwitchTick(): void {
  try {
    if (!iosSwitch || !iosSwitch.isConnected) {
      iosLabel = document.createElement("label");
      iosLabel.setAttribute("aria-hidden", "true");
      // In-viewport (bottom-left, under the content stack) and painted — a
      // 1px window clipping the real control. No opacity/visibility tricks.
      iosLabel.style.cssText =
        "position:fixed;bottom:0;left:0;width:1px;height:1px;overflow:hidden;z-index:-1;pointer-events:none";
      iosSwitch = document.createElement("input");
      iosSwitch.type = "checkbox";
      iosSwitch.setAttribute("switch", "");
      iosSwitch.tabIndex = -1;
      iosSwitch.style.cssText = "margin:0";
      iosLabel.appendChild(iosSwitch);
      document.body.appendChild(iosLabel);
    }
    // Click the LABEL — it forwards to the switch as a genuine user-style
    // toggle; the state change is what the OS reacts to.
    (iosLabel ?? iosSwitch).click();
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
