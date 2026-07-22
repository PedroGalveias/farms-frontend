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
  // Odometer (§7): roll from wherever the number currently sits to the new
  // value, so a filter change rolls the digits instead of hard-swapping. The
  // first paint rolls 0 → value once the number scrolls into view; every later
  // value change rolls from the last shown number.
  const fromRef = useRef(0);
  const seenRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const reduceMotion = prefersReducedMotion();
    let frame = 0;
    let start: number | null = null;
    const from = fromRef.current;

    const tick = (now: number) => {
      if (start === null) {
        start = now;
      }
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      // Track the currently-displayed value in fromRef every frame, so a prop
      // change mid-roll restarts from the frame on screen rather than the last
      // *completed* value (which would jump).
      const current =
        Math.round((from + (value - from) * eased) * factor) / factor;
      fromRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    const roll = () => {
      if (reduceMotion) {
        setDisplay(value);
        fromRef.current = value;
      } else {
        frame = requestAnimationFrame(tick);
      }
    };

    // Already revealed once → a value update: roll straight from the last shown
    // number. First time → wait until it scrolls into view, then roll 0 → value.
    if (seenRef.current) {
      roll();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          seenRef.current = true;
          roll();
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
    // Tabular figures (§7): fixed-width digits so the number doesn't jitter
    // horizontally as it counts, and stats line up column-wise.
    <span className={`tabular-nums ${className}`} ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
