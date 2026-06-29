"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  const drag = useRef({ startY: 0, offset: 0, active: false });

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
  const setOffset = (y: number) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = drag.current.active ? "none" : "";
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
  };

  const onPointerDown = (event: React.PointerEvent) => {
    // Drag-to-dismiss is a mobile gesture; on ≥sm the sheet is a centred modal.
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    drag.current = { startY: event.clientY, offset: 0, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.offset = Math.max(0, event.clientY - drag.current.startY);
    setOffset(drag.current.offset);
  };

  const endDrag = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const { offset } = drag.current;
    drag.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released — safe to ignore.
    }
    if (offset > DISMISS_THRESHOLD) {
      onClose();
    } else {
      setOffset(0);
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={closeLabel}
        className="qs-backdrop absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`qs-sheet relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] border border-line bg-cloud shadow-[0_-16px_60px_rgba(20,22,27,0.3)] transition-transform duration-300 sm:max-h-[80dvh] sm:rounded-[32px] sm:shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)] ${className}`}
        ref={sheetRef}
        role="dialog"
      >
        {/* Grabber — flick down to dismiss on touch; decorative on desktop. */}
        <div
          aria-hidden="true"
          className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing sm:hidden"
          onPointerCancel={endDrag}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
        >
          <span className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
