"use client";

import { useEffect, useState } from "react";
import { isApplePlatform } from "@/lib/platform";

/**
 * The shortcut-modifier label for this OS: "⌘" on Apple, "Ctrl" on
 * Windows/Linux. Defaults to "⌘" for SSR and the first client render (so
 * hydration matches), then corrects to "Ctrl" after mount on non-Apple
 * platforms — a one-character swap, no layout impact.
 */
export function useModKey(): string {
  const [mod, setMod] = useState("⌘");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const apple = isApplePlatform({
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    });
    if (!apple) {
      queueMicrotask(() => setMod("Ctrl"));
    }
  }, []);

  return mod;
}
