"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motionForced, setMotionForced } from "@/lib/motion";
import { useT } from "@/components/i18n/LanguageProvider";

const DISMISS_KEY = "farms.motionPromptDismissed";

/**
 * One-time prompt shown when the OS asks for reduced motion: on Windows the
 * "Animation effects" toggle is off on many machines without the user ever
 * choosing it, and then the whole site looks frozen "for no reason" in every
 * browser. The ⌘K override existed but nobody discovers it — this surfaces
 * the choice once, respectfully: enable animations, or keep them off and
 * never ask again. Fine-pointer devices only (that's where the reports come
 * from) and never shown when the user already decided either way.
 */
export default function MotionPrompt() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer = 0;
    try {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (
        reduced &&
        !motionForced() &&
        window.localStorage.getItem(DISMISS_KEY) !== "1" &&
        window.matchMedia("(any-pointer: fine)").matches
      ) {
        // A beat after load so it doesn't compete with the page appearing.
        timer = window.setTimeout(() => setOpen(true), 2500);
      }
    } catch {
      // Storage unavailable — skip the prompt entirely.
    }
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Best-effort.
    }
    setOpen(false);
  };

  return (
    <div
      // Bottom-RIGHT on every size, above the mobile tab bar, and it stays put
      // until the user picks (no auto-dismiss) — the earlier build vanished too
      // fast to read. z-[60] clears chrome (rail/tab bar are z-40).
      className="glass glass-card toast-enter cursor-zone fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-4 lg:bottom-24 lg:right-6"
      role="dialog"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pine/10 text-pine">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">
            {t("motion_prompt_title")}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            {t("motion_prompt_body")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98]"
          onClick={() => {
            setMotionForced(true);
            dismiss();
          }}
          type="button"
        >
          {t("motion_prompt_enable")}
        </button>
        <button
          className="rounded-full border border-line bg-cloud px-4 py-2.5 text-xs font-semibold text-ink/70 transition hover:text-ink"
          onClick={dismiss}
          type="button"
        >
          {t("motion_prompt_dismiss")}
        </button>
      </div>
    </div>
  );
}
