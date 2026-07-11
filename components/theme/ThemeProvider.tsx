"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  prefersReducedMotion,
  supportsViewTransitions,
} from "@/lib/view-transitions";
import { readStoredLocation } from "@/lib/geolocation";
import { DEFAULT_COORDS, isDaylight, nextSunFlip } from "@/lib/suncycle";

type Theme = "light" | "dark";
/**
 * How the theme is chosen:
 * - "light" / "dark": a manual pick (the header/rail toggle sets these).
 * - "system": follow prefers-color-scheme, live.
 * - "sun": light while the sun is up, dark after sunset (visitor's shared
 *   location when available, the middle of Switzerland otherwise).
 */
export type ThemeMode = "light" | "dark" | "system" | "sun";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: Theme) => void;
  /** `origin` (viewport coords of the click) seeds the circular reveal. */
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = "farms.themeMode";
// Legacy key (pre-modes): an explicit light/dark pick. Still written with the
// RESOLVED theme so the pre-paint boot script knows what to apply instantly
// even in system/sun mode.
const RESOLVED_KEY = "farms.theme";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function sunCoords() {
  return readStoredLocation() ?? DEFAULT_COORDS;
}

function resolveTheme(mode: ThemeMode): Theme {
  switch (mode) {
    case "light":
    case "dark":
      return mode;
    case "system":
      return systemPrefersDark() ? "dark" : "light";
    case "sun": {
      const { latitude, longitude } = sunCoords();
      return isDaylight(new Date(), latitude, longitude) ? "light" : "dark";
    }
  }
}

function readStoredMode(): ThemeMode {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    if (
      mode === "light" ||
      mode === "dark" ||
      mode === "system" ||
      mode === "sun"
    ) {
      return mode;
    }
    // Migration: an old explicit farms.theme pick becomes a manual mode.
    const legacy = localStorage.getItem(RESOLVED_KEY);
    if (legacy === "light" || legacy === "dark") return legacy;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The inline script in the layout applies the last RESOLVED theme before
  // paint; React state mirrors the DOM after mount and re-resolves live.
  const [theme, setThemeState] = useState<Theme>("light");
  const [mode, setModeState] = useState<ThemeMode>("system");
  const sunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(RESOLVED_KEY, next);
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

  // Re-resolve now and (in sun mode) at the next sunrise/sunset.
  const scheduleSun = useCallback(
    (activeMode: ThemeMode) => {
      if (sunTimer.current) {
        clearTimeout(sunTimer.current);
        sunTimer.current = null;
      }
      if (activeMode !== "sun") return;
      const { latitude, longitude } = sunCoords();
      const flip = nextSunFlip(new Date(), latitude, longitude);
      // +5s of slack so we land safely on the other side of the flip.
      const delay = Math.max(1_000, flip.getTime() - Date.now() + 5_000);
      sunTimer.current = setTimeout(() => {
        apply(resolveTheme("sun"));
        scheduleSun("sun");
      }, delay);
    },
    [apply],
  );

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {
        /* ignore unavailable storage */
      }
      apply(resolveTheme(next));
      scheduleSun(next);
    },
    [apply, scheduleSun],
  );

  // Mount: adopt the stored mode and re-resolve (the boot script only knew
  // the LAST resolved theme; system/sun may have flipped since).
  useEffect(() => {
    const stored = readStoredMode();
    queueMicrotask(() => {
      setModeState(stored);
      apply(resolveTheme(stored));
      scheduleSun(stored);
    });
    return () => {
      if (sunTimer.current) clearTimeout(sunTimer.current);
    };
  }, [apply, scheduleSun]);

  // System mode follows the OS live.
  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(resolveTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, apply]);

  // Sun mode re-checks when the tab comes back (laptops sleep through sunset).
  useEffect(() => {
    if (mode !== "sun") return;
    const onVisible = () => {
      if (!document.hidden) {
        apply(resolveTheme("sun"));
        scheduleSun("sun");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [mode, apply, scheduleSun]);

  /** Explicit pick — used by the toggle; switches to a manual mode. */
  const setTheme = useCallback(
    (next: Theme) => {
      setMode(next);
    },
    [setMode],
  );

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = document.documentElement.classList.contains("dark")
        ? "light"
        : "dark";

      // Premium touch: when supported, the new theme wipes in as a circle
      // expanding from the toggle. Feature-detected + reduced-motion-aware, so
      // it falls back to an instant flip everywhere else.
      if (!supportsViewTransitions() || prefersReducedMotion()) {
        setTheme(next);
        return;
      }

      const root = document.documentElement;
      const x = origin ? (origin.x / window.innerWidth) * 100 : 50;
      const y = origin ? (origin.y / window.innerHeight) * 100 : 50;
      root.style.setProperty("--theme-vt-x", `${x}%`);
      root.style.setProperty("--theme-vt-y", `${y}%`);
      root.classList.add("theme-vt");

      const transition = document.startViewTransition(() => setTheme(next));
      transition.finished.finally(() => root.classList.remove("theme-vt"));
    },
    [setTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, setMode, setTheme, toggleTheme }),
    [theme, mode, setMode, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
