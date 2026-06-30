"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { GO_SHORTCUTS, gChordHref } from "@/lib/shortcuts";
import { useT } from "@/components/i18n/LanguageProvider";
import { useViewTransitionNavigate } from "@/components/transitions/ViewTransitions";

const OPEN_EVENT = "farms:shortcuts-open";
// How long after pressing `g` the second key still completes the chord.
const CHORD_WINDOW_MS = 1200;

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid min-h-6 min-w-6 place-items-center rounded-md border border-line bg-paper px-1.5 text-[11px] font-bold text-ink/60">
      {children}
    </kbd>
  );
}

/**
 * Keyboard-first navigation: `g` then a key jumps to a page (Gmail/GitHub
 * style), and `?` opens a cheat sheet. Pure key handling — no platform APIs
 * beyond a native <dialog> for the help overlay, so it behaves identically on
 * Chromium, Gecko and WebKit. Ignores keystrokes while typing in a field.
 */
export default function KeyboardShortcuts() {
  const t = useT();
  const navigate = useViewTransitionNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingGAt = useRef(0);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "?") {
        event.preventDefault();
        pendingGAt.current = 0;
        setOpen(true);
        return;
      }

      if (event.key === "g" || event.key === "G") {
        pendingGAt.current = Date.now();
        return;
      }

      if (
        pendingGAt.current &&
        Date.now() - pendingGAt.current < CHORD_WINDOW_MS
      ) {
        const href = gChordHref(event.key);
        pendingGAt.current = 0;
        if (href) {
          event.preventDefault();
          navigate(href);
        }
        return;
      }
      pendingGAt.current = 0;
    };

    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [navigate]);

  return (
    <dialog
      aria-labelledby="shortcuts-title"
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl border border-line bg-cloud p-0 text-ink shadow-[0_40px_120px_-24px_rgba(20,22,27,0.55)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      onClose={close}
      ref={dialogRef}
    >
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <Keyboard className="h-5 w-5 text-pine" />
        <h2
          className="text-lg font-bold tracking-[-0.02em]"
          id="shortcuts-title"
        >
          {t("shortcuts_title")}
        </h2>
      </div>

      <div className="space-y-5 px-5 py-5">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/60">
            {t("shortcuts_general")}
          </p>
          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink/75">{t("command_open")}</span>
              <span className="flex items-center gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
                <span className="px-1 text-xs text-ink/30">/</span>
                <Kbd>/</Kbd>
              </span>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink/75">
                {t("shortcuts_title")}
              </span>
              <Kbd>?</Kbd>
            </li>
          </ul>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/60">
            {t("shortcuts_goto")}
          </p>
          <ul className="space-y-2">
            {GO_SHORTCUTS.map((shortcut) => (
              <li
                className="flex items-center justify-between gap-4"
                key={shortcut.key}
              >
                <span className="text-sm text-ink/75">
                  {t(shortcut.labelKey)}
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>g</Kbd>
                  <Kbd>{shortcut.key}</Kbd>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </dialog>
  );
}
