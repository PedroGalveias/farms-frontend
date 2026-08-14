"use client";

import { useEffect, useState } from "react";
import { parseFarmTaxonomy } from "@/lib/taxonomy";
import type { Locale } from "@/lib/i18n-core";
import type { FarmTaxonomy } from "@/types/taxonomy";

const pendingByLocale = new Map<Locale, Promise<FarmTaxonomy | null>>();

function loadTaxonomy(locale: Locale) {
  const existing = pendingByLocale.get(locale);
  if (existing) return existing;

  const request = fetch(`/api/taxonomy?lang=${locale}`)
    .then(async (response) =>
      response.ok ? parseFarmTaxonomy(await response.json()) : null,
    )
    .catch(() => null);
  const pending = request.finally(() => {
    // Share only in-flight requests. A failed request must not leave a
    // resolved-null promise in this map forever; the next open should retry.
    if (pendingByLocale.get(locale) === pending) {
      pendingByLocale.delete(locale);
    }
  });
  pendingByLocale.set(locale, pending);
  return pending;
}

/** Lazy client access to the cached taxonomy proxy, with an optional seed. */
export function useFarmTaxonomy({
  enabled = true,
  initial,
  locale,
}: {
  enabled?: boolean;
  initial?: FarmTaxonomy | null;
  locale: Locale;
}) {
  const [taxonomy, setTaxonomy] = useState<FarmTaxonomy | null>(
    initial?.lang === locale ? initial : null,
  );

  useEffect(() => {
    if (initial?.lang === locale) {
      queueMicrotask(() => setTaxonomy(initial));
      return;
    }
    if (!enabled) return;

    let cancelled = false;
    void loadTaxonomy(locale).then((result) => {
      if (!cancelled) setTaxonomy(result);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, initial, locale]);

  return taxonomy;
}
