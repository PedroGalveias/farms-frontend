"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Globe } from "lucide-react";
import { LOCALES } from "@/lib/i18n-core";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface LanguageMenuProps {
  /** "rail" opens the menu to the right; "header" opens it below-right. */
  placement?: "rail" | "header";
  triggerClassName?: string;
}

/**
 * Language switcher. The dropdown is portaled to <body> and positioned `fixed`
 * from the trigger's rect — floating chrome uses `backdrop-filter`, which makes
 * it a containing block, so an in-place `absolute` menu mispositions (it can
 * end up off-screen). Portalling escapes that entirely.
 */
export default function LanguageMenu({
  placement = "header",
  triggerClassName = "",
}: LanguageMenuProps) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const position = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    if (placement === "rail") {
      setStyle({
        position: "fixed",
        left: rect.right + 12,
        bottom: window.innerHeight - rect.bottom,
      });
    } else {
      setStyle({
        position: "fixed",
        top: rect.bottom + gap,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  useLayoutEffect(() => {
    if (open) position();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const reposition = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("lang_title")}
        className={triggerClassName}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title={t("lang_title")}
        type="button"
      >
        <Globe className="h-5 w-5" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="glass glass-chrome z-[70] min-w-[180px] max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5"
              ref={menuRef}
              role="menu"
              style={style}
            >
              <p className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
                {t("lang_title")}
              </p>
              {LOCALES.map(({ code, label }) => {
                const isActive = code === locale;
                return (
                  <button
                    aria-checked={isActive}
                    className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-tone text-pine"
                        : "text-ink/70 hover:bg-tone hover:text-ink"
                    }`}
                    key={code}
                    onClick={() => {
                      setLocale(code);
                      setOpen(false);
                    }}
                    role="menuitemradio"
                    type="button"
                  >
                    {label}
                    {isActive ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
