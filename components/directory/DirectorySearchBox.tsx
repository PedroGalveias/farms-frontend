"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Leaf, MapPin, Search, Store, X } from "lucide-react";
import {
  buildSuggestions,
  type Suggestion,
  type SuggestionType,
} from "@/lib/search-suggestions";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
} from "@/lib/recent-searches";
import { haptic } from "@/lib/haptics";
import { useT } from "@/components/i18n/LanguageProvider";

interface DirectorySearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  farms: { id: string; name: string; address: string; canton: string }[];
  categories: { value: string; label: string }[];
  cantons: { code: string; name: string }[];
  onSelectCategory: (value: string) => void;
  onSelectCanton: (code: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const typeIcon: Record<SuggestionType, typeof Store> = {
  farm: Store,
  category: Leaf,
  canton: MapPin,
};

export default function DirectorySearchBox({
  value,
  onChange,
  inputClassName,
  farms,
  categories,
  cantons,
  onSelectCategory,
  onSelectCanton,
  inputRef,
}: DirectorySearchBoxProps) {
  const t = useT();
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  // Hydrate recent searches post-mount (deferred so it doesn't set state
  // synchronously inside the effect).
  useEffect(() => {
    queueMicrotask(() => setRecent(readRecentSearches()));
  }, []);

  const suggestions = useMemo(
    () => buildSuggestions(value, { farms, categories, cantons }),
    [value, farms, categories, cantons],
  );

  const showRecent = value.trim().length === 0 && recent.length > 0;
  const rowCount = value.trim() ? suggestions.length : recent.length;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const remember = (term: string) => {
    const next = addRecentSearch(term);
    setRecent(next);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    haptic();
    remember(value);
    setOpen(false);
    if (suggestion.type === "farm") {
      router.push(`/farm/${encodeURIComponent(suggestion.id)}`);
    } else if (suggestion.type === "category") {
      onSelectCategory(suggestion.id);
    } else {
      onSelectCanton(suggestion.id);
    }
  };

  const selectRecent = (term: string) => {
    onChange(term);
    setActive(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && rowCount > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % rowCount);
    } else if (event.key === "ArrowUp" && rowCount > 0) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? rowCount - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (value.trim() && suggestions[active]) {
        event.preventDefault();
        selectSuggestion(suggestions[active]);
      } else if (showRecent && recent[active]) {
        event.preventDefault();
        selectRecent(recent[active]);
      } else if (value.trim()) {
        remember(value);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const hasDropdown =
    open && (value.trim() ? suggestions.length > 0 : showRecent);

  return (
    <div className="relative" ref={rootRef}>
      <label className="relative block">
        <span className="sr-only">{t("a11y_search")}</span>
        <Search className="pointer-events-none absolute bottom-0 left-4 top-0 my-auto h-4 w-4 text-ink/60" />
        <input
          aria-activedescendant={
            active >= 0 ? `${listId}-opt-${active}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={hasDropdown}
          autoComplete="off"
          className={`${inputClassName} pl-11 ${value ? "pr-10" : "pr-10"}`}
          data-slash-target=""
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("toolbar_searchPlaceholder")}
          ref={inputRef}
          role="combobox"
          value={value}
        />
        {value ? (
          <button
            aria-label={t("toolbar_clearSearch")}
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-chip text-ink/50 transition hover:bg-ink/[0.06] hover:text-ink"
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-field border border-line bg-tone px-1.5 py-0.5 text-[11px] font-semibold text-ink/70 sm:block"
          >
            /
          </kbd>
        )}
      </label>

      {hasDropdown ? (
        <div
          className="glass glass-chrome absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-field p-1.5"
          id={listId}
          role="listbox"
        >
          {value.trim() ? (
            suggestions.map((suggestion, index) => {
              const Icon = typeIcon[suggestion.type];
              return (
                <button
                  aria-selected={active === index}
                  className={`flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition ${
                    active === index ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]"
                  }`}
                  id={`${listId}-opt-${index}`}
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setActive(index)}
                  role="option"
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink/50" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {suggestion.label}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">
                    {t(`search_kind_${suggestion.type}`)}
                  </span>
                </button>
              );
            })
          ) : (
            <>
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/50">
                  {t("search_recent")}
                </span>
                <button
                  className="text-[11px] font-semibold text-ink/50 transition hover:text-ink"
                  onClick={() => setRecent(clearRecentSearches())}
                  type="button"
                >
                  {t("search_clear")}
                </button>
              </div>
              {recent.map((term, index) => (
                <button
                  aria-selected={active === index}
                  className={`flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition ${
                    active === index ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]"
                  }`}
                  id={`${listId}-opt-${index}`}
                  key={term}
                  onClick={() => selectRecent(term)}
                  onMouseEnter={() => setActive(index)}
                  role="option"
                  type="button"
                >
                  <Clock className="h-4 w-4 shrink-0 text-ink/40" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/80">
                    {term}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
