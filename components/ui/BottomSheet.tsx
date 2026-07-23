"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { haptic } from "@/lib/haptics";

interface BottomSheetProps {
  /** Close the sheet (backdrop tap, Escape, or a downward flick on mobile). */
  onClose: () => void;
  /** id of the heading element, wired to aria-labelledby. */
  labelledBy?: string;
  /** Accessible label for the invisible backdrop close button. */
  closeLabel: string;
  children: React.ReactNode;
  /** Extra classes merged onto the sheet container. */
  className?: string;
}

// How far the grabber must travel down before release dismisses the sheet.
const DISMISS_THRESHOLD = 110;
// How far a left-edge swipe must travel right before release dismisses. Lower
// than the vertical threshold — the edge gesture is a deliberate "back" intent,
// and the hot-zone is narrow, so there's less room to travel.
const EDGE_DISMISS_THRESHOLD = 90;
// A fast flick dismisses regardless of distance (px per ms) — the iOS "throw it
// away" gesture, so a short quick flick works like a long slow drag. Shared by
// the downward grabber flick and the rightward edge-swipe.
const FLICK_VELOCITY = 0.55;
// Spring the sheet back to rest / to the finger (the --ease-spring token gives
// a subtle overshoot; a linear tween reads as cheap).
const SPRING_BACK = "transform var(--dur-3) var(--ease-spring)";
const MOBILE_QUERY = "(max-width: 639px)";

/**
 * Shared bottom-sheet shell used by the near-me and visit-planner sheets.
 *
 * - Portals to <body> so position:fixed pins to the viewport even when the
 *   trigger lives inside a transformed (Reveal) ancestor.
 * - Locks page scroll, slides the mobile tab bar away (.sheet-open), Escape
 *   closes, and a tap on the backdrop closes.
 * - On mobile it gains a native drag-handle: flick the grabber down past a
 *   threshold to dismiss. Pointer Events are supported across Chromium, Gecko
 *   and WebKit; where unavailable the grabber is simply decorative and the
 *   backdrop/Escape/close paths still work (progressive enhancement).
 */
export default function BottomSheet({
  onClose,
  labelledBy,
  closeLabel,
  children,
  className = "",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    offset: 0,
    active: false,
  });
  // Horizontal edge-swipe ("back") gesture — separate state so it never fights
  // the vertical grabber drag. Only one can be active at a time (different
  // capture targets), so they can safely share `sheetRef`'s transform.
  const edge = useRef({
    startX: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    offset: 0,
    active: false,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sheet-open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Drive the drag straight through the DOM node to avoid a re-render per move.
  // `active` follows the finger 1:1 (no transition); on release we spring.
  const setOffset = (y: number, spring = false) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = drag.current.active
      ? "none"
      : spring
        ? SPRING_BACK
        : "";
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
  };

  const onPointerDown = (event: React.PointerEvent) => {
    // Drag-to-dismiss is a mobile gesture; on ≥sm the sheet is a centred modal.
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    const now = performance.now();
    drag.current = {
      startY: event.clientY,
      lastY: event.clientY,
      lastT: now,
      velocity: 0,
      offset: 0,
      active: true,
    };
    // Promote to a layer only for the duration of the gesture.
    if (sheetRef.current) sheetRef.current.style.willChange = "transform";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const now = performance.now();
    const raw = event.clientY - drag.current.startY;
    // Downward tracks 1:1; dragging up past rest rubber-bands (there's no higher
    // detent on this sheet), so the top feels elastic instead of stuck.
    const offset = raw >= 0 ? raw : raw * 0.18;
    const dt = now - drag.current.lastT || 1;
    drag.current.velocity = (event.clientY - drag.current.lastY) / dt;
    drag.current.lastY = event.clientY;
    drag.current.lastT = now;
    drag.current.offset = offset;
    setOffset(offset);
  };

  const endDrag = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const { offset, velocity } = drag.current;
    drag.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released — safe to ignore.
    }
    // Dismiss on enough travel OR a fast downward flick from any distance.
    if (offset > DISMISS_THRESHOLD || velocity > FLICK_VELOCITY) {
      haptic();
      onClose();
    } else {
      setOffset(0, true);
      // Drop the layer promotion once the spring-back settles.
      const el = sheetRef.current;
      window.setTimeout(() => {
        if (el && !drag.current.active) el.style.willChange = "";
      }, 380);
    }
  };

  // ── Left-edge swipe-to-dismiss (the iOS "back" gesture) ──────────────────
  const setOffsetX = (x: number, spring = false) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = edge.current.active
      ? "none"
      : spring
        ? SPRING_BACK
        : "";
    el.style.transform = x > 0 ? `translateX(${x}px)` : "";
  };

  const onEdgePointerDown = (event: React.PointerEvent) => {
    // Edge-swipe is a mobile gesture; on ≥sm the sheet is a centred modal.
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    const now = performance.now();
    edge.current = {
      startX: event.clientX,
      lastX: event.clientX,
      lastT: now,
      velocity: 0,
      offset: 0,
      active: true,
    };
    if (sheetRef.current) sheetRef.current.style.willChange = "transform";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onEdgePointerMove = (event: React.PointerEvent) => {
    if (!edge.current.active) return;
    const now = performance.now();
    const raw = event.clientX - edge.current.startX;
    // Rightward (dismiss direction) tracks 1:1; dragging back left past rest
    // rubber-bands so the edge feels elastic instead of stuck.
    const offset = raw >= 0 ? raw : raw * 0.18;
    const dt = now - edge.current.lastT || 1;
    edge.current.velocity = (event.clientX - edge.current.lastX) / dt;
    edge.current.lastX = event.clientX;
    edge.current.lastT = now;
    edge.current.offset = offset;
    setOffsetX(offset);
  };

  const endEdgeDrag = (event: React.PointerEvent) => {
    if (!edge.current.active) return;
    const { offset, velocity } = edge.current;
    edge.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released — safe to ignore.
    }
    // Dismiss on enough travel OR a fast rightward flick from any distance.
    if (offset > EDGE_DISMISS_THRESHOLD || velocity > FLICK_VELOCITY) {
      haptic();
      onClose();
    } else {
      setOffsetX(0, true);
      const el = sheetRef.current;
      window.setTimeout(() => {
        if (el && !edge.current.active) el.style.willChange = "";
      }, 380);
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={closeLabel}
        className="qs-backdrop absolute inset-0 bg-black/35 backdrop-blur-lg"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`glass qs-sheet relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-panel transition-transform duration-300 sm:max-h-[80dvh] sm:rounded-panel ${className}`}
        ref={sheetRef}
        role="dialog"
      >
        {/* Left-edge hot-zone — swipe right to dismiss (the iOS "back" gesture);
            a narrow reserved strip, mobile-only, invisible. Sits over the
            sheet's own left padding so it rarely competes with content. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-10 w-5 touch-none sm:hidden"
          data-edge-swipe="true"
          onPointerCancel={endEdgeDrag}
          onPointerDown={onEdgePointerDown}
          onPointerMove={onEdgePointerMove}
          onPointerUp={endEdgeDrag}
        />

        {/* Grabber — flick down to dismiss on touch; decorative on desktop. */}
        <div
          aria-hidden="true"
          data-grabber="true"
          className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing sm:hidden"
          onPointerCancel={endDrag}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
        >
          <span className="h-1.5 w-10 rounded-chip bg-ink/15" />
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
