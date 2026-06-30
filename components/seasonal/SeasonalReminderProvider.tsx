"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Bell, X } from "lucide-react";
import { haptic } from "@/lib/haptics";
import {
  produceEmoji,
  produceLabel,
  produceToQuickSearchKeys,
} from "@/lib/seasonal";
import {
  dueReminders,
  readAck,
  readReminders,
  writeAck,
  writeReminders,
} from "@/lib/seasonal-reminders";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface SeasonalReminderContextValue {
  isReminded: (key: string) => boolean;
  toggleReminder: (key: string) => void;
}

const SeasonalReminderContext =
  createContext<SeasonalReminderContextValue | null>(null);

export default function SeasonalReminderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, t } = useLanguage();
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [due, setDue] = useState<string[]>([]);

  // Hydrate subscriptions, then surface any reminders that are due right now.
  useEffect(() => {
    const stored = readReminders();
    queueMicrotask(() => {
      setSubscribed(stored);
      setDue(dueReminders(stored, new Date(), readAck()));
    });
  }, []);

  const isReminded = useCallback(
    (key: string) => subscribed.includes(key),
    [subscribed],
  );

  const toggleReminder = useCallback((key: string) => {
    haptic();
    setSubscribed((current) => {
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      writeReminders(next);
      return next;
    });
  }, []);

  // Dismissing acknowledges every shown nudge for this calendar year so it
  // doesn't reappear until the produce comes back into season next year.
  const dismissDue = useCallback(() => {
    const year = new Date().getFullYear();
    const ack = readAck();
    for (const key of due) ack[key] = year;
    writeAck(ack);
    setDue([]);
  }, [due]);

  const value = useMemo<SeasonalReminderContextValue>(
    () => ({ isReminded, toggleReminder }),
    [isReminded, toggleReminder],
  );

  const findHref = `/quick-search?products=${encodeURIComponent(
    produceToQuickSearchKeys(due).join(","),
  )}&match=any`;

  return (
    <SeasonalReminderContext.Provider value={value}>
      {children}

      {due.length > 0 && typeof document !== "undefined"
        ? createPortal(
            <div className="qs-sheet fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-3xl border border-line bg-cloud p-4 shadow-[0_24px_60px_-20px_rgba(20,22,27,0.5)] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:left-auto lg:w-[26rem]">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine/10 text-pine">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pine">
                    {t("reminder_toast_label")}
                  </p>
                  <p className="mt-1 text-[15px] font-bold leading-snug tracking-[-0.02em] text-ink">
                    {due
                      .slice(0, 4)
                      .map(
                        (key) =>
                          `${produceEmoji(key)} ${produceLabel(key, locale)}`,
                      )
                      .join(" · ")}
                    {due.length > 4 ? ` +${due.length - 4}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm leading-6 text-ink/60">
                    {t("reminder_toast_body")}
                  </p>
                </div>
                <button
                  aria-label={t("reminder_dismiss")}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/70 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                  onClick={dismissDue}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Link
                className="group mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                href={findHref}
                onClick={dismissDue}
              >
                {t("reminder_toast_cta")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>,
            document.body,
          )
        : null}
    </SeasonalReminderContext.Provider>
  );
}

export function useSeasonalReminders(): SeasonalReminderContextValue {
  const ctx = useContext(SeasonalReminderContext);
  if (!ctx) {
    throw new Error(
      "useSeasonalReminders must be used within a SeasonalReminderProvider",
    );
  }
  return ctx;
}
