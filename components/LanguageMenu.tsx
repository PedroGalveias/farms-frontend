"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES } from "@/lib/i18n";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface LanguageMenuProps {
  /** "rail" opens the menu to the right; "header" opens it below-right. */
  placement?: "rail" | "header";
  triggerClassName?: string;
}

export default function LanguageMenu({
  placement = "header",
  triggerClassName = "",
}: LanguageMenuProps) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menuPosition =
    placement === "rail"
      ? "bottom-0 left-full ml-3 origin-bottom-left"
      : "right-0 top-full mt-2 origin-top-right";

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("lang_title")}
        className={triggerClassName}
        onClick={() => setOpen((value) => !value)}
        title={t("lang_title")}
        type="button"
      >
        <Globe className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className={`absolute z-50 min-w-[170px] rounded-2xl border border-line bg-cloud p-1.5 shadow-[0_24px_50px_-20px_rgba(20,22,27,0.45)] ${menuPosition}`}
          role="menu"
        >
          <p className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">
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
        </div>
      ) : null}
    </div>
  );
}
