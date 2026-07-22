"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

export default function OfflinePage() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="glass w-full rounded-panel p-10">
        <span className="glass-inset mx-auto grid h-16 w-16 place-items-center rounded-field text-ink/60">
          <CloudOff className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-ink">
          {t("offline_title")}
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-ink/60">
          {t("offline_body")}
        </p>
        <button
          className="mt-7 inline-flex items-center gap-2 rounded-chip bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          onClick={() => window.location.reload()}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          {t("offline_retry")}
        </button>
      </div>
    </main>
  );
}
