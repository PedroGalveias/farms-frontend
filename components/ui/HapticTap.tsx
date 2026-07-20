"use client";

import { useEffect, useState } from "react";
import { hapticsEnabled, isIosLike } from "@/lib/haptics";

/**
 * iOS haptic tap-through — the /haptics-lab ground truth, productised.
 *
 * A REAL switch control toggled by a REAL finger tap reliably plays the
 * system haptic on iOS 17.4+ (lab row A), while programmatic `.click()`
 * tricks proved unreliable on device. So feedback buttons layer a genuine
 * `<input type="checkbox" switch>` over their surface: the finger taps the
 * switch (native toggle → system haptic) and the click bubbles on to the
 * button's own onClick unchanged.
 *
 * WebKit will not fire the haptic for a control it doesn't PAINT (opacity:0,
 * display:none, visibility:hidden and off-screen content all mute it), so the
 * switch can't be truly hidden — it's kept at a near-zero opacity that is
 * still a painted layer but visually imperceptible, even over the dark-glass
 * buttons where the earlier 5% opacity was faintly visible. It stays a native
 * switch (no `appearance:none`, which would drop the haptic with the styling).
 *
 * Renders only on iOS-like devices; everywhere else the button is unchanged
 * (Android keeps navigator.vibrate via haptic()). Place inside a
 * `position: relative` button.
 */

// The switch must be a PAINTED layer for WebKit to fire the haptic — the mute
// gate is a boolean (opacity 0 / display:none / visibility:hidden), not a
// visibility threshold — so any strictly-positive opacity should qualify. This
// is pushed near that floor: imperceptible even over dark-glass buttons, with
// a small margin so a computed opacity never rounds to 0. If a device stops
// ticking, /haptics-lab's "opacity floor" rows pinpoint the real minimum.
const OPACITY = 0.004;

// A native iOS switch paints ~51px wide and CANNOT be resized without losing
// its native rendering (and with it the haptic). One centered switch covers a
// small square button, but on a full-width row the finger taps the label near
// the left edge and misses it — so `wide` tiles a strip of real switches
// (slightly overlapped, extras clipped) across the whole surface instead.
const WIDE_TILE_COUNT = 12;

export default function HapticTap({ wide = false }: { wide?: boolean }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setEnabled(isIosLike(navigator) && hapticsEnabled()));
  }, []);

  if (!enabled) return null;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit] ${
        wide ? "flex items-center" : "grid place-items-center"
      }`}
    >
      {Array.from({ length: wide ? WIDE_TILE_COUNT : 1 }).map((_, i) => (
        <input
          className="pointer-events-auto shrink-0 cursor-[inherit]"
          key={i}
          style={{
            opacity: OPACITY,
            // Overlap neighbours a touch so there is no dead gap between
            // switch tracks anywhere along the row.
            margin: wide ? "0 -4px" : 0,
          }}
          tabIndex={-1}
          type="checkbox"
          {...{ switch: "" }}
        />
      ))}
    </span>
  );
}
