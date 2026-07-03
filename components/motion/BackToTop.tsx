"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useT } from "@/components/i18n/LanguageProvider";

// Show the button once the visitor has scrolled roughly a screen-and-a-half.
const SHOW_AFTER_PX = 900;

/**
 * A floating glass "back to top" button — a small native-app affordance on the
 * long directory/list pages. Appears after scrolling down, scrolls smoothly
 * back up (respecting reduced-motion) with a haptic tick, and sits clear of the
 * mobile tab bar. Hidden while a bottom sheet is open (body.sheet-open) so it
 * doesn't float over modal content.
 */
export default function BackToTop() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const scrolled = window.scrollY > SHOW_AFTER_PX;
      const sheetOpen = document.body.classList.contains("sheet-open");
      setVisible(scrolled && !sheetOpen);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    haptic();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      aria-hidden={!visible}
      aria-label={t("back_to_top")}
      className={`glass glass-chrome glass-interactive fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-12 w-12 place-items-center rounded-full text-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-ink/25 lg:bottom-6 lg:right-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      onClick={toTop}
      tabIndex={visible ? 0 : -1}
      type="button"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
