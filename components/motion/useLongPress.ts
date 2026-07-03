"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { haptic } from "@/lib/haptics";

const LONG_PRESS_MS = 450;
// Cancel the press if the finger drifts more than this (it's a scroll, not a
// hold).
const MOVE_TOLERANCE_PX = 10;

interface LongPressHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: () => void;
  onClick: (event: ReactPointerEvent | React.MouseEvent) => void;
}

/**
 * Long-press gesture for touch devices — the mobile equivalent of a
 * right-click. Fires `onLongPress` after a hold (with a haptic tick) and
 * suppresses the click that would otherwise follow, so a hold and a tap are
 * cleanly distinct. Mouse/precise pointers are ignored (they get the click
 * path only); a small move tolerance means it doesn't fight scrolling.
 */
export function useLongPress(
  onLongPress: (() => void) | undefined,
  onClick: () => void,
): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    startRef.current = null;
  };

  return {
    onPointerDown: (event) => {
      // Touch/pen only — mouse users have hover affordances and right-click.
      if (!onLongPress || event.pointerType === "mouse") return;
      firedRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        firedRef.current = true;
        haptic(18);
        onLongPress();
        clear();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (event) => {
      const start = startRef.current;
      if (!start) return;
      if (
        Math.abs(event.clientX - start.x) > MOVE_TOLERANCE_PX ||
        Math.abs(event.clientY - start.y) > MOVE_TOLERANCE_PX
      ) {
        clear();
      }
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onClick: (event) => {
      // If the long-press already fired, swallow the trailing click.
      if (firedRef.current) {
        firedRef.current = false;
        event.preventDefault();
        return;
      }
      onClick();
    },
  };
}
