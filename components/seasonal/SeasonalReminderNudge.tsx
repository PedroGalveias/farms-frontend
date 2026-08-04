"use client";

import { createPortal } from "react-dom";
import Link from "@/components/i18n/LocalizedLink";
import { ArrowRight, Bell, X } from "lucide-react";
import { produceEmoji, produceLabel } from "@/lib/seasonal";
import { produceToQuickSearchKeys } from "@/lib/seasonal-quick-search";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * The in-app nudge shown when subscribed produce comes into season.
 *
 * Split out of the provider and loaded on demand. It is the only consumer of
 * the seasonal label tables and — through `produceToQuickSearchKeys` — of the
 * 183-product catalogue, and it renders for a visitor who both subscribed to a
 * reminder and opened the app during that produce's season. Keeping it in the
 * provider meant every route paid for tables that almost no page view reads.
 */
export default function SeasonalReminderNudge({
  due,
  onDismiss,
}: {
  due: string[];
  onDismiss: () => void;
}) {
  const { locale, t } = useLanguage();

  if (due.length === 0 || typeof document === "undefined") {
    return null;
  }

  const findHref = `/quick-search?products=${encodeURIComponent(
    produceToQuickSearchKeys(due).join(","),
  )}&match=any`;

  return createPortal(
    <div className="glass glass-chrome qs-sheet fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-card p-4 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:left-auto lg:w-[26rem]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-pine/10 text-pine">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pine">
            {t("reminder_toast_label")}
          </p>
          <p className="mt-1 text-[15px] font-bold leading-snug tracking-[-0.02em] text-ink">
            {due
              .slice(0, 4)
              .map((key) => `${produceEmoji(key)} ${produceLabel(key, locale)}`)
              .join(" · ")}
            {due.length > 4 ? ` +${due.length - 4}` : ""}
          </p>
          <p className="mt-0.5 text-sm leading-6 text-ink/60">
            {t("reminder_toast_body")}
          </p>
        </div>
        <button
          aria-label={t("reminder_dismiss")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-chip text-ink/70 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Link
        className="group mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-chip bg-ink px-5 py-3 text-sm font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        href={findHref}
        onClick={onDismiss}
      >
        {t("reminder_toast_cta")}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </div>,
    document.body,
  );
}
