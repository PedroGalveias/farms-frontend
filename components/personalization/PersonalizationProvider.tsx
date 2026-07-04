"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  COLLECTIONS_STORAGE_KEY,
  deleteCollection,
  makeCollection,
  readCollections,
  removeFarmFromCollections,
  renameCollection,
  toggleFarmInCollection,
  writeCollections,
  type Collection,
} from "@/lib/collections";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useT } from "@/components/i18n/LanguageProvider";

interface PersonalizationValue {
  favorites: string[];
  favoritesCount: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  recent: string[];
  recordView: (id: string) => void;
  collections: Collection[];
  collectionsForFarm: (farmId: string) => string[];
  createCollection: (name: string, seedFarmId?: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  toggleFarmInCollection: (id: string, farmId: string) => void;
}

const PersonalizationContext = createContext<PersonalizationValue | null>(null);

/**
 * Account-free personalization shared across the app: favorite farms, a
 * recently-viewed history, and named collections — all persisted in
 * localStorage and synced across tabs. State starts empty (matching SSR) and
 * hydrates from storage on mount.
 */
export default function PersonalizationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Mirror favorites so callbacks can read the latest without re-binding.
  const favoritesRef = useRef(favorites);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // Toast + translator held in a ref so the toggle callbacks stay stable.
  const { toast } = useToast();
  const t = useT();
  const feedbackRef = useRef({ toast, t });
  useEffect(() => {
    feedbackRef.current = { toast, t };
  });

  useEffect(() => {
    queueMicrotask(() => {
      setFavorites(readFavorites());
      setRecent(readRecent());
      setCollections(readCollections());
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavorites(readFavorites());
      } else if (event.key === RECENT_STORAGE_KEY) {
        setRecent(readRecent());
      } else if (event.key === COLLECTIONS_STORAGE_KEY) {
        setCollections(readCollections());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const ensureFavorite = useCallback((farmId: string) => {
    if (favoritesRef.current.includes(farmId)) {
      return;
    }
    const next = [...favoritesRef.current, farmId];
    favoritesRef.current = next;
    writeFavorites(next);
    setFavorites(next);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const willRemove = favoritesRef.current.includes(id);
    const next = toggleId(favoritesRef.current, id);
    favoritesRef.current = next;
    writeFavorites(next);
    setFavorites(next);
    const { toast, t } = feedbackRef.current;
    toast({
      message: willRemove ? t("toast_removed") : t("toast_saved"),
      icon: willRemove ? undefined : <Heart className="h-4 w-4 fill-current" />,
    });
    // Un-favoriting also drops the farm from every collection.
    if (willRemove) {
      setCollections((current) => {
        const updated = removeFarmFromCollections(current, id);
        writeCollections(updated);
        return updated;
      });
    }
  }, []);

  const recordView = useCallback((id: string) => {
    setRecent((current) => {
      const next = recordRecent(current, id);
      writeRecent(next);
      return next;
    });
  }, []);

  const createCollectionCb = useCallback(
    (name: string, seedFarmId?: string): string => {
      const created = makeCollection(name, seedFarmId ? [seedFarmId] : []);
      if (!created) {
        return "";
      }
      setCollections((current) => {
        const next = [...current, created];
        writeCollections(next);
        return next;
      });
      if (seedFarmId) {
        ensureFavorite(seedFarmId);
      }
      return created.id;
    },
    [ensureFavorite],
  );

  const renameCollectionCb = useCallback(
    (id: string, name: string) =>
      setCollections((current) => {
        const next = renameCollection(current, id, name);
        writeCollections(next);
        return next;
      }),
    [],
  );

  const deleteCollectionCb = useCallback(
    (id: string) =>
      setCollections((current) => {
        const next = deleteCollection(current, id);
        writeCollections(next);
        return next;
      }),
    [],
  );

  const toggleFarmInCollectionCb = useCallback(
    (id: string, farmId: string) => {
      // Adding to a collection implies the farm is saved.
      ensureFavorite(farmId);
      setCollections((current) => {
        const next = toggleFarmInCollection(current, id, farmId);
        writeCollections(next);
        return next;
      });
    },
    [ensureFavorite],
  );

  const value = useMemo<PersonalizationValue>(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      recent,
      recordView,
      collections,
      collectionsForFarm: (farmId: string) =>
        collections
          .filter((collection) => collection.farmIds.includes(farmId))
          .map((collection) => collection.id),
      createCollection: createCollectionCb,
      renameCollection: renameCollectionCb,
      deleteCollection: deleteCollectionCb,
      toggleFarmInCollection: toggleFarmInCollectionCb,
    }),
    [
      favorites,
      recent,
      collections,
      toggleFavorite,
      recordView,
      createCollectionCb,
      renameCollectionCb,
      deleteCollectionCb,
      toggleFarmInCollectionCb,
    ],
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
