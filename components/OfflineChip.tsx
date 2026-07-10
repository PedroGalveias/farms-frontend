"use client";

import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Quiet "you're offline" indicator so the app reads as intentional (showing
 * cached/saved data) rather than broken when connectivity drops. Driven by the
 * standard online/offline events — supported on Chromium, Firefox, and WebKit.
 * Sits above the mobile tab bar and clears the home indicator.
 */
export default function OfflineChip() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    // Defer the initial read out of the effect body (repo lint: no sync setState).
    queueMicrotask(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="cursor-zone fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-ink/90 px-4 py-2 text-xs font-semibold text-cloud shadow-[0_10px_30px_-10px_rgba(20,22,27,0.5)] backdrop-blur-md lg:bottom-6"
      role="status"
    >
      <CloudOff className="h-3.5 w-3.5" />
      {t("offline_status")}
    </div>
  );
}
