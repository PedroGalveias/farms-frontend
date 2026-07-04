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
      const c = container.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      indicator.style.width = `${a.width}px`;
      indicator.style.height = `${a.height}px`;
      indicator.style.transform = `translate(${a.left - c.left}px, ${a.top - c.top}px)`;
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
