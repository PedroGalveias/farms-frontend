"use client";

import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** How far the element drifts toward the cursor, 0–1. */
  strength?: number;
}

/**
 * Wraps an interactive element so it drifts gently toward the pointer while
 * hovered, then springs back on leave. The motion is applied via a CSS
 * transform on a wrapping span, so it composes with whatever it contains
 * (a Link, a button, …). Disabled for coarse pointers / reduced motion.
 */
export default function Magnetic({
  children,
  className = "",
  strength = 0.35,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const node = ref.current;
    if (!node || !canHover()) {
      return;
    }
    const rect = node.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    node.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const reset = () => {
    const node = ref.current;
    if (node) {
      node.style.transform = "translate(0, 0)";
    }
  };

  return (
    <span
      className={`inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${className}`}
      onPointerLeave={reset}
      onPointerMove={handleMove}
      ref={ref}
    >
      {children}
    </span>
  );
}
