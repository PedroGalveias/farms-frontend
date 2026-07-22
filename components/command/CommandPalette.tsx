"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useViewTransitionNavigate } from "@/components/transitions/ViewTransitions";
import {
  ArrowRight,
  CornerDownLeft,
  Keyboard,
  LayoutGrid,
  Leaf,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  Moon,
  Search,
  Sparkles,
  Sprout,
  Store,
} from "lucide-react";
import { rankCommands, type CommandItem } from "@/lib/command";
import { getCantonName, SWISS_CANTONS } from "@/lib/farms";
import { motionForced, setMotionForced } from "@/lib/motion";
import { PRODUCTS, productLabel } from "@/lib/products";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { Farm } from "@/types/farm";

/** A command plus how to act on it (kept out of the serialisable CommandItem). */
interface ResolvedCommand extends CommandItem {
  icon: LucideIcon;
  href?: string;
  run?: () => void;
}

const OPEN_EVENT = "farms:command-open";

/**
 * ⌘K / Ctrl+K command palette: fuzzy search across farms, products and pages
 * plus a couple of quick actions. Built on the native <dialog> element so the
 * top layer, ::backdrop, focus trap and Escape-to-close all come from the
 * platform and behave identically on Chromium, Gecko and WebKit (Baseline:
 * Chrome 37 / Firefox 98 / Safari 15.4). Also opens on "/" outside a field and
 * on a `farms:command-open` window event (the desktop rail button).
 */
export default function CommandPalette() {
  const t = useT();
  const { locale } = useLanguage();
  const navigate = useViewTransitionNavigate();
  const { toggleTheme } = useTheme();
  const { recent } = usePersonalization();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [farmsError, setFarmsError] = useState(false);
  // The animations override (see lib/motion.ts) — read lazily on open so the
  // label reflects reality even when another tab changed it.
  const [motionOn, setMotionOn] = useState(false);
  useEffect(() => {
    if (open) queueMicrotask(() => setMotionOn(motionForced()));
  }, [open]);

  // ---- Open / close, driven through the native dialog --------------------
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Global shortcuts: ⌘K/Ctrl+K toggles, "/" opens (outside inputs), and a
  // custom event lets the desktop rail open it too.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (
        key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        // Pages with their own slash-search (the directory toolbar) own "/";
        // the palette only claims it where no such target exists.
        !document.querySelector("[data-slash-target]")
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Reset query/selection and focus the field each time it opens.
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setQuery("");
        setActive(0);
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Lazily pull the farm list the first time the palette is opened.
  useEffect(() => {
    if (!open || farms !== null) return;
    let cancelled = false;
    fetch("/api/farms")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Farm[]) => {
        if (!cancelled) setFarms(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setFarms([]);
          setFarmsError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, farms]);

  // ---- Candidate commands -------------------------------------------------
  const pages = useMemo<ResolvedCommand[]>(
    () => [
      {
        id: "page:directory",
        kind: "page",
        label: t("nav_directory"),
        icon: LayoutGrid,
        href: "/",
      },
      {
        id: "page:quick-search",
        kind: "page",
        label: t("nav_quickSearch"),
        icon: Search,
        href: "/quick-search",
      },
      {
        id: "page:saved",
        kind: "page",
        label: t("saved_title"),
        icon: Store,
        href: "/saved",
      },
      {
        id: "page:seasonal",
        kind: "page",
        label: t("seasonal_title"),
        icon: Sprout,
        href: "/seasonal",
      },
    ],
    [t],
  );

  const actions = useMemo<ResolvedCommand[]>(
    () => [
      {
        id: "action:theme",
        kind: "action",
        label: t("command_toggle_theme"),
        icon: Moon,
        run: toggleTheme,
      },
      {
        id: "action:shortcuts",
        kind: "action",
        label: t("shortcuts_title"),
        icon: Keyboard,
        run: () =>
          window.dispatchEvent(new CustomEvent("farms:shortcuts-open")),
      },
      {
        // Rescues machines where the OS reduced-motion setting (Windows
        // "Animation effects" off is common) silently freezes the whole app.
        id: "action:motion",
        kind: "action",
        label: motionOn ? t("command_motion_system") : t("command_motion_on"),
        keywords: "animation motion reduce animations",
        icon: Sparkles,
        run: () => {
          setMotionForced(!motionOn);
          setMotionOn(!motionOn);
        },
      },
    ],
    [t, toggleTheme, motionOn],
  );

  const cantonItems = useMemo<ResolvedCommand[]>(
    () =>
      SWISS_CANTONS.map(({ code }) => ({
        id: `canton:${code}`,
        kind: "canton",
        label: getCantonName(code),
        hint: t("command_kind_canton"),
        keywords: code,
        icon: MapIcon,
        href: `/canton/${code.toLowerCase()}`,
      })),
    [t],
  );

  const productItems = useMemo<ResolvedCommand[]>(
    () =>
      Object.keys(PRODUCTS).map((key) => ({
        id: `product:${key}`,
        kind: "product",
        label: productLabel(key, locale),
        hint: t("command_kind_product"),
        keywords: key,
        icon: Leaf,
        href: `/quick-search?products=${encodeURIComponent(key)}&match=any`,
      })),
    [locale, t],
  );

  const farmItems = useMemo<ResolvedCommand[]>(
    () =>
      (farms ?? []).map((farm) => ({
        id: `farm:${farm.id}`,
        kind: "farm",
        label: farm.name,
        hint: `${farm.canton} · ${getCantonName(farm.canton)}`,
        keywords: farm.address,
        icon: MapPin,
        href: `/farm/${farm.id}`,
      })),
    [farms],
  );

  const allItems = useMemo<ResolvedCommand[]>(
    () => [...pages, ...actions, ...cantonItems, ...farmItems, ...productItems],
    [pages, actions, cantonItems, farmItems, productItems],
  );

  // Empty-query default: pages, recently viewed farms, then the theme action.
  const defaults = useMemo<ResolvedCommand[]>(() => {
    const byId = new Map(farmItems.map((item) => [item.id, item]));
    const recentFarms = recent
      .map((id) => byId.get(`farm:${id}`))
      .filter((item): item is ResolvedCommand => item != null)
      .slice(0, 5);
    return [...pages, ...recentFarms, ...actions];
  }, [pages, actions, farmItems, recent]);

  const results = useMemo<ResolvedCommand[]>(
    () => (query.trim() === "" ? defaults : rankCommands(query, allItems)),
    [query, defaults, allItems],
  );

  // Keep the highlighted index in range and scrolled into view.
  useEffect(() => {
    queueMicrotask(() =>
      setActive((value) => Math.min(value, Math.max(results.length - 1, 0))),
    );
  }, [results.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const select = useCallback(
    (item: ResolvedCommand | undefined) => {
      if (!item) return;
      setOpen(false);
      if (item.href) {
        navigate(item.href);
      } else {
        item.run?.();
      }
    },
    [navigate],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[active]);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(results.length - 1);
    }
  };

  return (
    <dialog
      aria-label={t("command_open")}
      className="glass cmdk-dialog mx-auto mb-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-card p-0 text-ink backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      onClose={close}
      ref={dialogRef}
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-5 w-5 shrink-0 text-ink/60" />
        <input
          aria-activedescendant={results[active]?.id}
          aria-controls="cmdk-list"
          aria-expanded
          autoComplete="off"
          className="w-full bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-ink/60"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder={t("command_placeholder")}
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
        />
        <kbd className="hidden shrink-0 rounded-field border border-line px-1.5 py-0.5 text-[11px] font-semibold text-ink/60 sm:block">
          Esc
        </kbd>
      </div>

      {/* A div (not ul) so the options can be its *direct* children, as the
          listbox role requires — an <li> between listbox and option breaks the
          ARIA parent/child contract. */}
      <div
        className="max-h-[min(24rem,60vh)] overflow-y-auto p-2"
        id="cmdk-list"
        ref={listRef}
        role="listbox"
      >
        {results.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink/60">
            {farms === null && query.trim() !== ""
              ? t("command_loading")
              : t("command_empty")}
          </p>
        ) : (
          results.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === active;
            return (
              <button
                aria-selected={isActive}
                className={`flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition ${
                  isActive ? "bg-pine/10 text-ink" : "text-ink/80"
                }`}
                data-index={index}
                id={item.id}
                key={item.id}
                onClick={() => select(item)}
                onPointerMove={() => setActive(index)}
                role="option"
                type="button"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-field ${
                    isActive ? "bg-pine/15 text-pine" : "bg-tone text-ink/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                    {item.label}
                  </span>
                  {item.hint ? (
                    <span className="block truncate text-xs text-ink/60">
                      {item.hint}
                    </span>
                  ) : null}
                </span>
                {isActive ? (
                  item.run ? (
                    <CornerDownLeft className="h-4 w-4 shrink-0 text-ink/30" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink/30" />
                  )
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] font-medium text-ink/60">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-line px-1 py-0.5">↑↓</kbd>
          {t("command_hint_nav")}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-line px-1 py-0.5">↵</kbd>
          {t("command_hint_select")}
        </span>
        {farmsError ? (
          <span className="ml-auto text-ink/30">{t("command_offline")}</span>
        ) : null}
      </div>
    </dialog>
  );
}
