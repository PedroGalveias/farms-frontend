"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Route } from "lucide-react";
import { MAX_TRIP_STOPS, readTrip, writeTrip, type TripStop } from "@/lib/trip";
import { haptic } from "@/lib/haptics";
import { useT } from "@/components/i18n/LanguageProvider";
import TripSheet from "@/components/trip/TripSheet";

interface TripContextValue {
  stops: TripStop[];
  isInTrip: (id: string) => boolean;
  /** Add the stop, or remove it if already planned. Returns the new state. */
  toggleStop: (stop: TripStop) => void;
  removeStop: (id: string) => void;
  clearTrip: () => void;
  isFull: boolean;
  openTrip: () => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export default function TripProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  const [stops, setStops] = useState<TripStop[]>([]);
  const [open, setOpen] = useState(false);

  // Hydrate from localStorage after mount (SSR renders an empty plan).
  useEffect(() => {
    const stored = readTrip();
    if (stored.length > 0) {
      queueMicrotask(() => setStops(stored));
    }
  }, []);

  const persist = useCallback((next: TripStop[]) => {
    setStops(next);
    writeTrip(next);
  }, []);

  const isInTrip = useCallback(
    (id: string) => stops.some((stop) => stop.id === id),
    [stops],
  );

  const toggleStop = useCallback((stop: TripStop) => {
    haptic();
    setStops((current) => {
      const next = current.some((s) => s.id === stop.id)
        ? current.filter((s) => s.id !== stop.id)
        : current.length >= MAX_TRIP_STOPS
          ? current
          : [...current, stop];
      writeTrip(next);
      return next;
    });
  }, []);

  const removeStop = useCallback(
    (id: string) => {
      persist(stops.filter((stop) => stop.id !== id));
    },
    [persist, stops],
  );

  const clearTrip = useCallback(() => {
    persist([]);
    setOpen(false);
  }, [persist]);

  const value = useMemo<TripContextValue>(
    () => ({
      stops,
      isInTrip,
      toggleStop,
      removeStop,
      clearTrip,
      isFull: stops.length >= MAX_TRIP_STOPS,
      openTrip: () => setOpen(true),
    }),
    [stops, isInTrip, toggleStop, removeStop, clearTrip],
  );

  return (
    <TripContext.Provider value={value}>
      {children}

      {/* Floating planner pill — only once at least one farm is planned. */}
      {stops.length > 0 ? (
        <button
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.6)] transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 lg:bottom-6 lg:right-6"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Route className="h-4 w-4" />
          {t("trip_open")}
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cloud px-1 text-[11px] font-bold text-ink">
            {stops.length}
          </span>
        </button>
      ) : null}

      {open ? (
        <TripSheet
          onClear={clearTrip}
          onClose={() => setOpen(false)}
          onRemove={removeStop}
          stops={stops}
        />
      ) : null}
    </TripContext.Provider>
  );
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return ctx;
}
