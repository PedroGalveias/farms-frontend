"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
} from "@/lib/i18n";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const VALID: Locale[] = ["en", "de", "fr", "it", "rm"];

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start from the default so SSR and first client render match, then adopt the
  // saved choice once mounted (a brief flash for non-default locales, no
  // hydration mismatch).
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      LOCALE_STORAGE_KEY,
    ) as Locale | null;
    if (stored && VALID.includes(stored) && stored !== DEFAULT_LOCALE) {
      // Defer out of the effect body so we adopt the saved locale after the
      // first (default) render without a hydration mismatch.
      queueMicrotask(() => setLocaleState(stored));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT(): Translate {
  return useLanguage().t;
}
