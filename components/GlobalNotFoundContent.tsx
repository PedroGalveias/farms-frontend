"use client";

import { useEffect, useSyncExternalStore } from "react";
import GoBackButton from "@/components/GoBackButton";
import { isLocale, localizedPath, type Locale } from "@/lib/i18n-core";

const COPY: Record<
  Locale,
  {
    lead: string;
    accent: string;
    body: string;
    back: string;
    directory: string;
  }
> = {
  en: {
    lead: "This page wandered",
    accent: "off the map.",
    body: "The page you're looking for isn't here. Head back to where you were, or start again from the directory.",
    back: "Go back",
    directory: "Go to the directory",
  },
  de: {
    lead: "Diese Seite ist",
    accent: "von der Karte verschwunden.",
    body: "Die gesuchte Seite ist nicht hier. Geh zurück oder beginne erneut im Verzeichnis.",
    back: "Zurück",
    directory: "Zum Verzeichnis",
  },
  fr: {
    lead: "Cette page s’est",
    accent: "égarée hors de la carte.",
    body: "La page recherchée n’est pas ici. Revenez en arrière ou repartez de l’annuaire.",
    back: "Retour",
    directory: "Ouvrir l’annuaire",
  },
  it: {
    lead: "Questa pagina è",
    accent: "uscita dalla mappa.",
    body: "La pagina che cerchi non è qui. Torna indietro o riparti dall’elenco.",
    back: "Indietro",
    directory: "Apri l’elenco",
  },
  rm: {
    lead: "Questa pagina è",
    accent: "svanida da la charta.",
    body: "La pagina tschertgada n’è betg qua. Va enavos u cumenza danovamain en il register.",
    back: "Enavos",
    directory: "Avrir il register",
  },
};

const subscribe = () => () => {};

function localeFromPath(): Locale {
  const segment = window.location.pathname.split("/")[1];
  return isLocale(segment) ? segment : "en";
}

/** Localizes the out-of-layout global 404 from its URL after hydration. */
export default function GlobalNotFoundContent() {
  const locale = useSyncExternalStore<Locale>(
    subscribe,
    localeFromPath,
    () => "en",
  );
  const copy = COPY[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="relative overflow-clip">
      <main className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
        <p className="rise-in text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Error 404
        </p>
        <h1
          className="rise-in mt-5 max-w-3xl text-display font-extrabold leading-[0.9] tracking-[-0.045em] text-ink"
          style={{ ["--rise-delay" as string]: "80ms" }}
        >
          {copy.lead} <span className="text-pine">{copy.accent}</span>
        </h1>
        <p
          className="rise-in mt-6 max-w-xl text-lg leading-8 text-ink/60"
          style={{ ["--rise-delay" as string]: "180ms" }}
        >
          {copy.body}
        </p>

        <div
          className="rise-in mt-9 flex flex-wrap items-center gap-3"
          style={{ ["--rise-delay" as string]: "260ms" }}
        >
          <GoBackButton label={copy.back} />
          {/* This page has no app shell, so the directory needs a real document
              load to establish providers and chrome. */}
          <a
            className="text-sm font-bold text-pine underline underline-offset-4"
            href={localizedPath("/", locale)}
          >
            {copy.directory}
          </a>
        </div>
      </main>
    </div>
  );
}
