"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

const STORAGE_KEY = "farms.qsCoachSeen";

/**
 * A one-time, dismissible hint on the quick-search flow — explains the 3-step
 * "where you are → what you want → nearest farms" shape to first-time visitors
 * to lift activation. Shown once ever (localStorage), never blocks the UI, and
 * fades in shortly after arrival so it doesn't fight the page entrance.
 */
export default function QuickSearchCoach() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private mode / storage blocked — treat as seen (don't nag).
    }
    if (seen) return;
    const timer = window.setTimeout(() => setVisible(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="glass toast-enter mt-6 flex items-start gap-3 rounded-field p-4">
      <span className="glass-inset grid h-9 w-9 shrink-0 place-items-center rounded-chip text-pine">
        <Lightbulb className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-[-0.01em] text-ink">
          {t("qs_coach_title")}
        </p>
        <p className="mt-1 text-[13px] leading-6 text-ink/60">
          {t("qs_coach_body")}
        </p>
        <button
          className="mt-2.5 inline-flex items-center rounded-chip bg-ink px-4 py-1.5 text-[13px] font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          onClick={dismiss}
          type="button"
        >
          {t("qs_coach_dismiss")}
        </button>
      </div>
      <button
        aria-label={t("qs_coach_dismiss")}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-chip text-ink/40 transition hover:bg-ink/[0.06] hover:text-ink"
        onClick={dismiss}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
