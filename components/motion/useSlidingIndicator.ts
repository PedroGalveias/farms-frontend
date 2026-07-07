"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Drives a single "active pill" that slides between nav items — the native
 * tab-bar motion. Measures the active item relative to its container and writes
 * the indicator's transform/size straight to the DOM (no React state, so it's
 * cheap and doesn't re-render the nav). The first placement is instant; every
 * later move (active change, resize) animates via the indicator's CSS
 * transition. Works for horizontal *and* vertical bars — it positions by rect.
 */
export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  activeRef: RefObject<HTMLElement | null> | null,
  indicatorRef: RefObject<HTMLElement | null>,
  activeKey: string | undefined,
) {
  const first = useRef(true);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const place = () => {
      const container = containerRef.current;
      const active = activeRef?.current ?? null;
      if (!container || !active) {
        indicator.style.opacity = "0";
        return;
      }
      // Position from LAYOUT offsets (offsetLeft/Top/Width/Height), not
      // getBoundingClientRect. Rects are in viewport space and pick up any
      // CSS transform on an ancestor — during a route View Transition the
      // root is transformed, so a mid-flight rect read placed the pill at a
      // wrong spot and it visibly bounced (to the target, back toward the
      // previous, then to the target). Offsets are transform-immune layout
      // metrics relative to the positioned container (the nav), so the pill
      // slides once, cleanly. (The active link's offsetParent is the nav.)
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      indicator.style.opacity = "1";
    };

    if (first.current) {
      // Don't animate the initial placement from the corner.
      const prev = indicator.style.transition;
      indicator.style.transition = "none";
      place();
      requestAnimationFrame(() => {
        indicator.style.transition = prev;
      });
      first.current = false;
    } else {
      place();
    }

    const raf = requestAnimationFrame(place); // settle after fonts/layout
    // ResizeObserver is absent in some test environments (jsdom).
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [containerRef, activeRef, indicatorRef, activeKey]);
}
