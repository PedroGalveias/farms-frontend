"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  prefersReducedMotion,
  supportsViewTransitions,
} from "@/lib/view-transitions";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** `origin` (viewport coords of the click) seeds the circular reveal. */
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "farms.theme";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The inline script in the layout sets the `dark` class before paint to
  // avoid a flash; here we just mirror it into React state after mount.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    queueMicrotask(() => setThemeState(isDark ? "dark" : "light"));
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

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
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
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
