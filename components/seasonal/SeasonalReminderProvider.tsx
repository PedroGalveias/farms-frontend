"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { haptic } from "@/lib/haptics";
import {
  dueReminders,
  readAck,
  readReminders,
  writeAck,
  writeReminders,
} from "@/lib/seasonal-reminders";
import dynamic from "next/dynamic";

// Loaded only when a reminder is actually due. See the component's own note:
// it carries the seasonal label tables and the product catalogue, and almost
// no page view renders it.
const SeasonalReminderNudge = dynamic(
  () => import("@/components/seasonal/SeasonalReminderNudge"),
  { ssr: false },
);

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

  return (
    <SeasonalReminderContext.Provider value={value}>
      {children}

      <SeasonalReminderNudge due={due} onDismiss={dismissDue} />
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
