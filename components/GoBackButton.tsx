"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Returns the visitor to wherever they came from. Falls back to the home page
 * when there's no in-app history (e.g. a cold landing on a 404). Primary nav
 * lives in the floating bar, so this is the only control the 404 needs.
 */
export default function GoBackButton() {
  const router = useRouter();
  const t = useT();

  return (
    <button
      className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
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
      {t("not_found_back")}
    </button>
  );
}
