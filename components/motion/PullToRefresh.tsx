"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/lib/haptics";

// How far (px) you must pull past the top before release triggers a refresh.
const TRIGGER_PX = 72;
// Rubber-band damping so the pull feels resistant, like iOS.
const DAMPING = 0.5;
const MAX_PULL_PX = 120;

interface PullToRefreshProps {
  onRefresh: () => void;
  /** Goes true while the refresh is in flight (keeps the spinner up). */
  isRefreshing: boolean;
  children: React.ReactNode;
}

/**
 * Native-app pull-to-refresh for touch devices. Because the app sets
 * `overscroll-behavior: none` (no rubber-band), we own the gesture: a
 * downward drag while the window is scrolled to the very top reveals a
 * spinner that follows the finger; releasing past the threshold fires
 * `onRefresh`. Mouse/desktop never engages (wrong pointer type), and it stays
 * out of the way of normal scrolling (only arms at scrollTop 0).
 */
export default function PullToRefresh({
  onRefresh,
  isRefreshing,
  children,
}: PullToRefreshProps) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startY: 0, tracking: false, armed: false });

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      // Only arm at the very top, single finger.
      if (window.scrollY > 0 || event.touches.length !== 1) return;
      state.current.startY = event.touches[0].clientY;
      state.current.tracking = true;
      state.current.armed = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!state.current.tracking) return;
      const delta = event.touches[0].clientY - state.current.startY;
      // Upward move (or scrolled away from top) cancels.
      if (delta <= 0 || window.scrollY > 0) {
        state.current.tracking = false;
        setDragging(false);
        setPull(0);
        return;
      }
      setDragging(true);
      const damped = Math.min(delta * DAMPING, MAX_PULL_PX);
      setPull(damped);
      // Tick once when it first crosses the trigger threshold.
      const nowArmed = damped >= TRIGGER_PX;
      if (nowArmed && !state.current.armed) haptic(12);
      state.current.armed = nowArmed;
      // Suppress the browser's own scroll/overscroll while we drive the pull.
      if (event.cancelable) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!state.current.tracking) return;
      const shouldRefresh = state.current.armed;
      state.current.tracking = false;
      state.current.armed = false;
      setDragging(false);
      setPull(0);
      if (shouldRefresh) onRefresh();
    };

    // passive:false on move so preventDefault can hold the viewport still.
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onRefresh]);

  // While refreshing, park the indicator at the threshold so the spinner shows
  // until the data settles.
  const offset = isRefreshing ? TRIGGER_PX : pull;
  const visible = offset > 2;

  return (
    <>
      {/* Anchored just below the floating header pill (sticky, z-40) so the
          spinner emerges into clear space instead of hiding behind it; sits
          above the header (z-45) as it travels down. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.25rem)] z-[45] flex justify-center lg:hidden"
        style={{
          transform: `translateY(${Math.max(offset - 40, 0)}px)`,
          opacity: visible ? 1 : 0,
          transition: dragging
            ? "none"
            : "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s",
        }}
      >
        <span className="glass grid h-10 w-10 place-items-center rounded-full text-ink/70">
          <RefreshCw
            className={`h-4 w-4 transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${Math.min(offset * 3, 270)}deg)`,
            }}
          />
        </span>
      </div>
      {children}
    </>
  );
}
