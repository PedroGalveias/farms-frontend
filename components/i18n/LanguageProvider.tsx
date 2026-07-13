"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  interpolate,
  isLocale,
  localizedPath,
  type Dict,
  type Locale,
} from "@/lib/i18n-core";
import { en } from "@/lib/messages/en";

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

/** The current path with any locale segment stripped. */
function unlocalizedPathname(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first)) {
    return `/${rest.join("/")}`;
  }
  return pathname;
}

export default function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  messages,
}: {
  children: React.ReactNode;
  /** The URL's locale segment — the single source of truth (SSR included). */
  initialLocale?: Locale;
  /** The ACTIVE locale's strings, provided by the server layout so the other
   *  four dictionaries never reach the client bundle. English needs no table
   *  (the imported fallback IS English). */
  messages?: Dict;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = initialLocale;

  // Switching language = navigating to the same page under the new locale.
  // The choice is persisted in a cookie so the middleware redirects future
  // unprefixed visits, and mirrored to localStorage for anything client-side
  // that wants it without a request.
  const setLocale = useCallback(
    (next: Locale) => {
      try {
        document.cookie = `${LOCALE_STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
      const target = localizedPath(unlocalizedPathname(pathname ?? "/"), next);
      router.push(target);
    },
    [router, pathname],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      // Active-locale table first, English fallback, then the raw key (the
      // no-gaps unit test keeps all five tables in sync, so the fallback only
      // matters for genuinely unknown keys).
      t: (key, vars) => interpolate(messages?.[key] ?? en[key] ?? key, vars),
    }),
    [locale, setLocale, messages],
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
