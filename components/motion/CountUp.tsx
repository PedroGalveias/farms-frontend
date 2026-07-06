"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  className?: string;
  /** Decimal places to render while counting (e.g. 1 for distances). */
  decimals?: number;
  durationMs?: number;
  /** Rendered after the animated number (e.g. a "+"). */
  suffix?: string;
}

import { prefersReducedMotion } from "@/lib/motion";

/**
 * Counts up from zero to `value` the first time it enters the viewport.
 * Uses requestAnimationFrame with an ease-out curve so the number decelerates
 * into its final state.
 */
export default function CountUp({
  value,
  className = "",
  decimals = 0,
  durationMs = 1400,
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const factor = 10 ** decimals;

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const reduceMotion = prefersReducedMotion();
    let frame = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) {
        start = now;
      }
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value * factor) / factor);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (reduceMotion) {
            setDisplay(value);
          } else {
            frame = requestAnimationFrame(tick);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [durationMs, factor, value]);

  return (
    <span className={className} ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
