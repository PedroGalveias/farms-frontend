"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer } from "@/lib/platform";

/**
 * Desktop custom cursor: an instant dot plus a lagging ring that follows the
 * pointer. The ring turns green and grows over interactive elements, and
 * becomes a labelled pill over anything carrying a `data-cursor` attribute
 * (e.g. result rows show "Open"). Per the product spec it is enabled only for
 * fine pointers on wide viewports with motion allowed, is hidden over form
 * fields (native caret restored via CSS), and is purely decorative.
 */
export default function CustomCursor() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () =>
      setActive(
        hasFinePointer(window) &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          window.innerWidth >= 1024,
      );

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };
    let frame = 0;

    const render = () => {
      ring.x += (target.x - ring.x) * 0.2;
      ring.y += (target.y - ring.y) * 0.2;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;

      const el = event.target as HTMLElement | null;
      if (el?.closest("input, textarea, select")) {
        setVisible(false);
        return;
      }

      setVisible(true);
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      setLabel(labelled?.dataset.cursor ?? null);
      setInteractive(
        Boolean(el?.closest("a, button, [role='button'], label, summary")),
      );
    };

    const hide = () => setVisible(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    document.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [active]);

  if (!active) {
    return null;
  }

  const showLabel = label !== null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className={`fixed left-0 top-0 flex items-center justify-center rounded-full font-semibold transition-[width,height,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showLabel
            ? "h-7 border-transparent bg-ink px-3 text-[11px] text-cloud"
            : interactive
              ? "h-12 w-12 border-[1.5px] border-pine bg-pine/15 text-transparent"
              : "h-8 w-8 border-[1.5px] border-ink/35 bg-transparent text-transparent"
        }`}
        ref={ringRef}
        style={showLabel ? { width: "auto" } : undefined}
      >
        {label}
      </div>
      <div
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink transition-opacity duration-200"
        ref={dotRef}
        style={{ opacity: interactive || showLabel ? 0 : 1 }}
      />
    </div>
  );
}
