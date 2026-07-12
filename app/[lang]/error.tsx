"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Route-segment error boundary. Renders within the root layout (so chrome +
 * providers are available) and offers a recover ("try again") path plus the
 * usual "go back". Catastrophic root-layout failures fall through to
 * global-error.tsx.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    // Surface for diagnostics (and a future error-monitoring hook).
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-5 pt-16 sm:px-8 sm:pt-24">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
        Error
      </p>
      <h1 className="mt-5 max-w-2xl text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-ink">
        {t("error_title")}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-ink/60">
        {t("error_body")}
      </p>

      <div className="mt-9">
        <button
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          onClick={reset}
          type="button"
        >
          <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
          {t("error_retry")}
        </button>
      </div>
    </main>
  );
}
