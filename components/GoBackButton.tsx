"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Returns the visitor to wherever they came from. Falls back to the home page
 * when there's no in-app history (e.g. a cold landing on a 404). Primary nav
 * lives in the floating bar, so this is the only control the 404 needs.
 *
 * The label is a prop rather than a `useT()` lookup because this also renders
 * on app/global-not-found.tsx, which is served for URLs matching no route and
 * therefore renders outside the [lang] layout, with no LanguageProvider above
 * it. Callers inside the layout pass a translated string.
 */
export default function GoBackButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      className="group inline-flex items-center gap-2 rounded-chip bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-elev-3 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      type="button"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
      {label}
    </button>
  );
}
