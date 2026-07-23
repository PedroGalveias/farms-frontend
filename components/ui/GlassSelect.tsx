"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: string;
  /** Optional group heading — consecutive options sharing a group render
   *  under one label (the styled analogue of `<optgroup>`). */
  group?: string;
}

interface GlassSelectProps {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  value: string;
  /** Styling for the trigger — pass the toolbar's shared field class so the
   *  control sits flush with the inputs beside it. */
  triggerClassName?: string;
  /** Optional leading icon inside the trigger (e.g. the sort glyph). */
  icon?: React.ReactNode;
}

/**
 * A designed replacement for `<select>` (design §9): the native control was
 * the one piece of OS chrome left on the glass toolbar. A button + glass
 * popover implementing the WAI-ARIA listbox pattern — full keyboard support
 * (arrows, Home/End, Enter/Space, Escape) and type-ahead — with option
 * groups. The popover portals to <body>: the toolbar is a backdrop-filter
 * surface, which would otherwise trap a fixed-position popover (the same
 * containing-block quirk LanguageMenu works around).
 */
export default function GlassSelect({
  ariaLabel,
  icon,
  onChange,
  options,
  triggerClassName = "",
  value,
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typeahead = useRef<{ buffer: string; at: number }>({
    buffer: "",
    at: 0,
  });
  const [style, setStyle] = useState<React.CSSProperties>({});
  const id = useId();

  const selected = options.find((option) => option.value === value);

  const openList = () => {
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) {
      onChange(option.value);
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        minWidth: rect.width,
        zIndex: 90,
      });
    }
    listRef.current?.focus({ preventScroll: true });
    // Bring the active option into view once the list has painted.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    // Scrolling/resizing invalidates the fixed rect — close rather than drift.
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const moveActive = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), options.length - 1);
    setActiveIndex(clamped);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeIndex);
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      // Type-ahead: accumulate keystrokes for 600ms and jump to the first
      // label with that prefix, wrapping past the current position. The
      // event's own timeStamp keeps the handler pure (no Date.now()).
      const now = event.timeStamp;
      const state = typeahead.current;
      state.buffer =
        now - state.at > 600
          ? event.key.toLowerCase()
          : state.buffer + event.key.toLowerCase();
      state.at = now;
      const start = state.buffer.length === 1 ? activeIndex + 1 : activeIndex;
      const rotated = [...options.slice(start), ...options.slice(0, start)];
      const hit = rotated.findIndex((option) =>
        option.label.toLowerCase().startsWith(state.buffer),
      );
      if (hit >= 0) {
        moveActive((start + hit) % options.length);
      }
    }
  };

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`${triggerClassName} inline-flex w-full items-center gap-2 text-left`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (
            !open &&
            (event.key === "ArrowDown" ||
              event.key === "ArrowUp" ||
              event.key === "Enter" ||
              event.key === " ")
          ) {
            event.preventDefault();
            openList();
          }
        }}
        ref={triggerRef}
        type="button"
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/45 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-activedescendant={`${id}-${activeIndex}`}
              aria-label={ariaLabel}
              className="glass glass-card max-h-[min(20rem,60vh)] overflow-y-auto rounded-field p-1.5 shadow-elev-3 outline-none"
              onKeyDown={handleListKeyDown}
              ref={listRef}
              role="listbox"
              style={style}
              tabIndex={-1}
            >
              {options.map((option, index) => {
                // A heading renders where a group starts — derived from the
                // previous option, no render-scope mutation.
                const heading =
                  option.group && option.group !== options[index - 1]?.group
                    ? option.group
                    : null;
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <div key={option.value}>
                    {heading ? (
                      <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">
                        {heading}
                      </p>
                    ) : null}
                    <button
                      aria-selected={isSelected}
                      className={`flex w-full items-center gap-2 rounded-field px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-ink text-cloud"
                          : isSelected
                            ? "text-pine"
                            : "text-ink/75 hover:bg-tone"
                      }`}
                      data-active={isActive || undefined}
                      id={`${id}-${index}`}
                      onClick={() => commit(index)}
                      onPointerMove={() => setActiveIndex(index)}
                      role="option"
                      tabIndex={-1}
                      type="button"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
