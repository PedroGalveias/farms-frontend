"use client";

import { useEffect } from "react";
import { hasFinePointer } from "@/lib/platform";

// How strongly scroll velocity lights the glint (px/frame → 0..1).
const GLINT_GAIN = 24;
// How far the band is pushed off-centre by velocity (%, clamped).
const BAND_PUSH = 1.6;
const BAND_LIMIT = 42;
// Ambient-orb parallax: slow counter-drift, clamped so the overdraw covers it.
const ORB_FACTOR = -0.05;
const ORB_LIMIT = 130;

/**
 * Scroll-reactive light for the liquid-glass surfaces — the "fluidity" half of
 * the material. While you scroll:
 *
 * - a glint band sweeps across every pane in the scroll direction, brightness
 *   proportional to velocity, easing back to invisible when you stop
 *   (--glass-glint / --glass-glint-x, consumed by .glass::before);
 * - the ambient colour orbs behind the page drift slightly against the scroll
 *   (--orb-y on body::after), so the light each pane refracts genuinely
 *   changes with movement.
 *
 * On fine pointers it additionally tracks the cursor: the hovered pane gets a
 * soft glow that follows the pointer (--glass-hover / --glass-px / --glass-py,
 * consumed by .glass::before) and fades out on leave — the desktop analogue of
 * tilting liquid glass on iOS.
 *
 * Renders nothing. The rAF loops only run while light is in motion, and
 * everything is skipped under prefers-reduced-motion (vars default to rest).
 */
export default function GlassLight() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const root = document.documentElement;
    let lastY = window.scrollY;
    let glint = 0; // current band intensity, 0..1
    let pos = 50; // current band position, %
    let target = 50; // where velocity is pushing the band
    let raf = 0;
    let running = false;

    const settle = () => {
      pos += (target - pos) * 0.14;
      target += (50 - target) * 0.08;
      glint *= 0.9;
      root.style.setProperty("--glass-glint", glint.toFixed(3));
      root.style.setProperty("--glass-glint-x", pos.toFixed(2));
      if (glint > 0.01 || Math.abs(pos - 50) > 0.5) {
        raf = requestAnimationFrame(settle);
      } else {
        root.style.setProperty("--glass-glint", "0");
        root.style.setProperty("--glass-glint-x", "50");
        running = false;
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      const velocity = y - lastY;
      lastY = y;

      const orb = Math.max(-ORB_LIMIT, Math.min(ORB_LIMIT, y * ORB_FACTOR));
      root.style.setProperty("--orb-y", orb.toFixed(1));

      glint = Math.min(1, Math.abs(velocity) / GLINT_GAIN + glint * 0.55);
      target =
        50 + Math.max(-BAND_LIMIT, Math.min(BAND_LIMIT, velocity * BAND_PUSH));

      if (!running) {
        running = true;
        raf = requestAnimationFrame(settle);
      }
    };

    // ---- Pointer-following glow (fine pointers only) ----------------------
    let hovered: HTMLElement | null = null;
    let pointerRaf = 0;
    let pending: PointerEvent | null = null;
    const finePointer = hasFinePointer(window);

    const applyPointer = () => {
      pointerRaf = 0;
      const event = pending;
      pending = null;
      if (!event) return;

      const pane =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".glass")
          : null;

      if (pane !== hovered) {
        // CSS transitions the opacity, so leave/enter cross-fade smoothly.
        hovered?.style.setProperty("--glass-hover", "0");
        hovered = pane;
        hovered?.style.setProperty("--glass-hover", "1");
      }
      if (hovered) {
        const rect = hovered.getBoundingClientRect();
        // Oversized background layers position inversely, so flip the ratio —
        // this puts the glow's centre under the cursor.
        const px = (1 - (event.clientX - rect.left) / rect.width) * 100;
        const py = (1 - (event.clientY - rect.top) / rect.height) * 100;
        hovered.style.setProperty("--glass-px", px.toFixed(1));
        hovered.style.setProperty("--glass-py", py.toFixed(1));
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pending = event;
      if (!pointerRaf) pointerRaf = requestAnimationFrame(applyPointer);
    };

    const onPointerOut = () => {
      hovered?.style.setProperty("--glass-hover", "0");
      hovered = null;
    };

    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerOut);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (finePointer) {
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.removeEventListener(
          "pointerleave",
          onPointerOut,
        );
        cancelAnimationFrame(pointerRaf);
      }
    };
  }, []);

  return null;
}
