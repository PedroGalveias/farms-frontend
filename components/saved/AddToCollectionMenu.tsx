"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FolderPlus, Plus } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { playTick } from "@/lib/sound";
import HapticTap from "@/components/ui/HapticTap";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";

/** Per-card dropdown to add/remove a farm from collections, or make a new one. */
export default function AddToCollectionMenu({
  farmId,
  className = "relative",
  triggerClassName = "relative z-10 inline-flex items-center gap-1.5 rounded-chip border border-line bg-cloud px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20",
}: {
  farmId: string;
  /** Wrapper class (defaults to `relative`; pass `relative w-full` in a grid). */
  className?: string;
  /** Trigger button class, to match sibling buttons in different layouts. */
  triggerClassName?: string;
}) {
  const t = useT();
  const {
    collections,
    collectionsForFarm,
    toggleFarmInCollection,
    createCollection,
  } = usePersonalization();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const memberCount = collectionsForFarm(farmId).length;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const submitNew = () => {
    if (createCollection(name, farmId)) {
      // Creating a collection also adds this farm to it — confirm it.
      haptic();
      playTick();
      setName("");
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <button
        aria-expanded={open}
        className={triggerClassName}
        onClick={() => {
          haptic();
          playTick();
          setOpen((value) => !value);
        }}
        type="button"
      >
        <FolderPlus className="h-4 w-4" />
        {t("collection_addTo")}
        {memberCount > 0 ? (
          <span className="rounded-chip bg-pine/10 px-1.5 text-[0.65rem] font-bold text-pine">
            {memberCount}
          </span>
        ) : null}
        <HapticTap wide />
      </button>

      {open ? (
        <div className="glass glass-chrome absolute left-0 z-30 mt-2 w-64 rounded-field p-2">
          {collections.length > 0 ? (
            <div className="max-h-52 overflow-y-auto">
              {collections.map((collection) => {
                const member = collection.farmIds.includes(farmId);
                return (
                  <button
                    aria-pressed={member}
                    className="relative flex w-full items-center justify-between gap-2 rounded-field px-2.5 py-2 text-left text-sm font-medium text-ink/75 transition hover:bg-tone focus-visible:ring-2 focus-visible:ring-ink/20"
                    key={collection.id}
                    onClick={() => {
                      // Add OR remove from the collection — both get the same
                      // confirmation (haptic + sound + iOS tap-through).
                      haptic();
                      playTick();
                      toggleFarmInCollection(collection.id, farmId);
                    }}
                    type="button"
                  >
                    <span className="truncate">{collection.name}</span>
                    {member ? (
                      <Check className="h-4 w-4 shrink-0 text-pine" />
                    ) : null}
                    <HapticTap wide />
                  </button>
                );
              })}
            </div>
          ) : null}

          <form
            className={`flex items-center gap-1 ${
              collections.length > 0 ? "mt-1 border-t border-line pt-2" : ""
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              submitNew();
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-field border border-line bg-paper px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-ink/60 focus:border-pine/50"
              onChange={(event) => setName(event.target.value)}
              placeholder={t("collection_name_placeholder")}
              value={name}
            />
            <button
              aria-label={t("collection_create")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-field bg-ink text-cloud transition hover:-translate-y-0.5 disabled:opacity-40"
              disabled={name.trim().length === 0}
              type="submit"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
