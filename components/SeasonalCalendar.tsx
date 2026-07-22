"use client";

import Link from "@/components/i18n/LocalizedLink";
import { ArrowLeft, ArrowRight, Bell, Sprout } from "lucide-react";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { useSeasonalReminders } from "@/components/seasonal/SeasonalReminderProvider";
import {
  SEASONAL_BY_MONTH,
  produceEmoji,
  produceLabel,
  seasonalProductsForMonth,
} from "@/lib/seasonal";
import type { Locale } from "@/lib/i18n-core";

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-CH",
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
  rm: "rm-CH",
};

/** Full-year view of Switzerland's in-season produce, one card per month. */
export default function SeasonalCalendar() {
  const { locale } = useLanguage();
  const t = useT();
  const { isReminded, toggleReminder } = useSeasonalReminders();
  const currentMonth = new Date().getMonth();

  const monthName = (index: number) =>
    new Date(2024, index, 1).toLocaleDateString([INTL_LOCALE[locale], "en"], {
      month: "long",
    });

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("farm_back")}
      </Link>

      <header className="mt-6 max-w-2xl">
        <h1 className="text-title font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {t("seasonal_title")}
        </h1>
        <p className="mt-3 text-lg leading-7 text-ink/60">
          {t("seasonal_subtitle")}
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SEASONAL_BY_MONTH.map((items, month) => {
          const isCurrent = month === currentMonth;
          const seasonalKeys = seasonalProductsForMonth(month);

          return (
            <section
              className={`glass glass-card flex flex-col rounded-card p-5 transition-colors ${
                isCurrent ? "ring-1 ring-inset ring-pine/30" : ""
              }`}
              key={month}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold capitalize tracking-[-0.02em] text-ink">
                  {monthName(month)}
                </h2>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-chip bg-pine-surface px-2.5 py-1 text-[11px] font-bold text-white">
                    <Sprout className="h-3 w-3" />
                    {t("season_label")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
                {items.map((key) => {
                  const reminded = isReminded(key);
                  return (
                    <button
                      aria-label={
                        reminded
                          ? t("reminder_remove")
                          : `${t("reminder_add")}: ${produceLabel(key, locale)}`
                      }
                      aria-pressed={reminded}
                      className={`group/chip inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 ${
                        reminded
                          ? "bg-pine/10 text-pine"
                          : "glass-chip text-ink/70 hover:bg-ink/[0.06]"
                      }`}
                      key={key}
                      onClick={() => toggleReminder(key)}
                      title={
                        reminded ? t("reminder_remove") : t("reminder_add")
                      }
                      type="button"
                    >
                      {produceEmoji(key)} {produceLabel(key, locale)}
                      <Bell
                        className={`h-3 w-3 transition ${
                          reminded
                            ? "fill-current text-pine"
                            : "text-ink/25 group-hover/chip:text-ink/60"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <Link
                className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-pine transition hover:text-ink"
                href={`/quick-search?products=${encodeURIComponent(seasonalKeys.join(","))}&match=any`}
              >
                {t("season_cta")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </section>
          );
        })}
      </div>
    </main>
  );
}
