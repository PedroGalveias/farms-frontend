"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/components/i18n/LanguageProvider";

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const isDark = theme === "dark";
  const label = isDark ? t("theme_switchLight") : t("theme_switchDark");

  return (
    <button
      aria-checked={isDark}
      aria-label={label}
      className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-chip border transition-colors duration-300 ${
        isDark ? "border-white/10 bg-[#1d2026]" : "border-black/5 bg-[#e8e7e0]"
      } ${className}`}
      onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
      role="switch"
      title={label}
      type="button"
    >
      <span
        className={`absolute top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-chip shadow-elev-1 transition-[left] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? "left-[29px] bg-[#0e0f12] text-amber-300"
            : "left-[3px] bg-white text-amber-500"
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3" />
        ) : (
          <Sun className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}
