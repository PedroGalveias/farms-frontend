"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FAVORITES_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  readFavorites,
  readRecent,
  recordRecent,
  toggleId,
  writeFavorites,
  writeRecent,
} from "@/lib/personalization";

interface PersonalizationValue {
  favorites: string[];
  favoritesCount: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  recent: string[];
  recordView: (id: string) => void;
}

const PersonalizationContext = createContext<PersonalizationValue | null>(null);

/**
 * Account-free personalization shared across the app: favorite farms and a
 * recently-viewed history, persisted in localStorage and kept in sync across
 * tabs. State starts empty (matching SSR) and hydrates from storage on mount.
 */
export default function PersonalizationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    // Defer out of the effect body (repo lint: no sync setState in effects).
    queueMicrotask(() => {
      setFavorites(readFavorites());
      setRecent(readRecent());
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavorites(readFavorites());
      } else if (event.key === RECENT_STORAGE_KEY) {
        setRecent(readRecent());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = toggleId(current, id);
      writeFavorites(next);
      return next;
    });
  }, []);

  const recordView = useCallback((id: string) => {
    setRecent((current) => {
      const next = recordRecent(current, id);
      writeRecent(next);
      return next;
    });
  }, []);

  const value = useMemo<PersonalizationValue>(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      recent,
      recordView,
    }),
    [favorites, recent, toggleFavorite, recordView],
  );

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization(): PersonalizationValue {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error(
      "usePersonalization must be used within a PersonalizationProvider",
    );
  }
  return context;
}
