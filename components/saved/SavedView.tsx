"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  Heart,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import FarmCard from "@/components/FarmCard";
import FarmDetailSheet from "@/components/quick-search/FarmDetailSheet";
import AddToCollectionMenu from "@/components/saved/AddToCollectionMenu";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { farmsToCsv } from "@/lib/export";
import type { Farm } from "@/types/farm";

const chipClassName = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
    active
      ? "border-ink bg-ink text-cloud shadow-[0_8px_20px_-8px_rgba(20,22,27,0.5)]"
      : "border-line bg-cloud text-ink/60 hover:border-ink/25 hover:text-ink"
  }`;

export default function SavedView({ farms }: { farms: Farm[] }) {
  const t = useT();
  const {
    favorites,
    collections,
    recordView,
    createCollection,
    renameCollection,
    deleteCollection,
  } = usePersonalization();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [renameValue, setRenameValue] = useState<string | null>(null);

  const byId = new Map(farms.map((farm) => [farm.id, farm]));
  const resolve = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((farm): farm is Farm => farm != null);

  const activeCollection =
    activeTab === "all"
      ? null
      : (collections.find((collection) => collection.id === activeTab) ?? null);

  // If a selected collection was deleted, fall back to "All saved".
  const effectiveTab =
    activeTab !== "all" && !activeCollection ? "all" : activeTab;
  const shownFarms = activeCollection
    ? resolve(activeCollection.farmIds)
    : resolve(favorites);

  const openFarm = (farm: Farm) => {
    recordView(farm.id);
    setActiveFarm(farm);
  };

  const exportCsv = () => {
    const blob = new Blob([farmsToCsv(shownFarms)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const filename =
      `farms-${activeCollection ? activeCollection.name : "saved"}.csv`
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 transition hover:text-ink"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("nav_directory")}
      </Link>

      <header className="mt-6 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine/10 text-pine">
          <Heart className="h-6 w-6 fill-current" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
            {t("saved_title")}
          </h1>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            {t("saved_subtitle")}
          </p>
        </div>
        {shownFarms.length > 0 ? (
          <button
            className="ml-auto inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line bg-cloud px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={exportCsv}
            type="button"
          >
            <Download className="h-4 w-4" />
            {t("saved_export")}
          </button>
        ) : null}
      </header>

      {/* Collection tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          className={chipClassName(effectiveTab === "all")}
          onClick={() => setActiveTab("all")}
          type="button"
        >
          {t("saved_all")}
          <span
            className={effectiveTab === "all" ? "text-cloud/55" : "text-ink/35"}
          >
            {favorites.length}
          </span>
        </button>

        {collections.map((collection) => (
          <button
            className={chipClassName(effectiveTab === collection.id)}
            key={collection.id}
            onClick={() => setActiveTab(collection.id)}
            type="button"
          >
            {collection.name}
            <span
              className={
                effectiveTab === collection.id ? "text-cloud/55" : "text-ink/35"
              }
            >
              {collection.farmIds.length}
            </span>
          </button>
        ))}

        {isCreating ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              const id = createCollection(newName);
              if (id) {
                setNewName("");
                setIsCreating(false);
                setActiveTab(id);
              }
            }}
          >
            <input
              autoFocus
              className="w-44 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink/35 focus:border-pine/50"
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t("collection_name_placeholder")}
              value={newName}
            />
            <button
              aria-label={t("collection_create")}
              className="grid h-8 w-8 place-items-center rounded-full bg-ink text-cloud disabled:opacity-40"
              disabled={newName.trim().length === 0}
              type="submit"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              aria-label={t("collection_cancel")}
              className="grid h-8 w-8 place-items-center rounded-full bg-tone text-ink/60 hover:text-ink"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line bg-cloud px-3.5 py-1.5 text-[13px] font-semibold text-ink/55 transition hover:border-ink/30 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("collection_new")}
          </button>
        )}
      </div>

      {/* Rename / delete the active collection */}
      {activeCollection ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {renameValue !== null ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                renameCollection(activeCollection.id, renameValue);
                setRenameValue(null);
              }}
            >
              <input
                autoFocus
                className="w-44 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] text-ink outline-none focus:border-pine/50"
                onChange={(event) => setRenameValue(event.target.value)}
                value={renameValue}
              />
              <button
                aria-label={t("collection_rename")}
                className="grid h-8 w-8 place-items-center rounded-full bg-ink text-cloud disabled:opacity-40"
                disabled={renameValue.trim().length === 0}
                type="submit"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                aria-label={t("collection_cancel")}
                className="grid h-8 w-8 place-items-center rounded-full bg-tone text-ink/60 hover:text-ink"
                onClick={() => setRenameValue(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <>
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cloud px-3.5 py-1.5 text-[13px] font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                onClick={() => setRenameValue(activeCollection.name)}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("collection_rename")}
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cloud px-3.5 py-1.5 text-[13px] font-semibold text-rose-600/80 transition hover:border-rose-300 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300"
                onClick={() => {
                  deleteCollection(activeCollection.id);
                  setActiveTab("all");
                }}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("collection_delete")}
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* Grid / empty states */}
      {shownFarms.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shownFarms.map((farm) => (
            <div className="flex flex-col gap-2" key={farm.id}>
              <FarmCard
                farm={farm}
                onOpen={() => openFarm(farm)}
                variant="grid"
              />
              <AddToCollectionMenu farmId={farm.id} />
            </div>
          ))}
        </div>
      ) : activeCollection ? (
        <p className="mt-10 rounded-[28px] border border-dashed border-line bg-tone/40 px-6 py-16 text-center text-[15px] leading-7 text-ink/55">
          {t("collection_empty")}
        </p>
      ) : (
        <section className="mt-10 rounded-[32px] border border-dashed border-line bg-tone/40 px-6 py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pine/10 text-pine">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-ink">
            {t("saved_empty_title")}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-ink/55">
            {t("saved_empty_body")}
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            href="/"
          >
            {t("saved_browse")}
          </Link>
        </section>
      )}

      {activeFarm ? (
        <FarmDetailSheet
          farm={activeFarm}
          onClose={() => setActiveFarm(null)}
          selectedProducts={[]}
        />
      ) : null}
    </main>
  );
}
