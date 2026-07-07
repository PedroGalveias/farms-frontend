"use client";

import { useEffect, useState } from "react";
import { isIosLike } from "@/lib/haptics";

/**
 * iOS haptic tap-through — the /haptics-lab ground truth, productised.
 *
 * A REAL switch control toggled by a REAL finger tap reliably plays the
 * system haptic on iOS 17.4+ (lab row A), while programmatic `.click()`
 * tricks have proven unreliable on device. So primary feedback buttons layer
 * a genuine `<input type="checkbox" switch>` under the finger: it sits on
 * top of the button at 5% opacity (imperceptible, but painted — 0 would mute
 * it), receives the actual tap (native toggle → system haptic), and the
 * click bubbles on to the button's own onClick unchanged.
 *
 * Renders only on iOS-like devices — everywhere else the button behaves
 * exactly as before (Android haptics stay on navigator.vibrate via haptic()).
 * Place inside a `position: relative` button.
 */
export default function HapticTap() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setEnabled(isIosLike(navigator)));
  }, []);

  if (!enabled) return null;

  return (
    <span
      aria-hidden
      className="absolute inset-0 z-20 grid place-items-center overflow-hidden rounded-[inherit]"
    >
      <input
        className="cursor-[inherit]"
        style={{ opacity: 0.05, margin: 0 }}
        tabIndex={-1}
        type="checkbox"
        {...{ switch: "" }}
      />
    </span>
  );
}
