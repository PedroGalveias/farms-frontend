// Keyboard "go to" chords: press `g` then a second key to jump to a page
// (Gmail/GitHub style). The map is data so both the key handler and the cheat
// sheet render from one source of truth. labelKey reuses existing i18n nav keys.

export interface GoShortcut {
  /** Second key in the chord, after `g`. */
  key: string;
  href: string;
  /** i18n key for the destination's display name. */
  labelKey: string;
}

export const GO_SHORTCUTS: GoShortcut[] = [
  { key: "h", href: "/", labelKey: "nav_directory" },
  { key: "q", href: "/quick-search", labelKey: "nav_quickSearch" },
  { key: "s", href: "/saved", labelKey: "saved_title" },
  { key: "c", href: "/seasonal", labelKey: "seasonal_title" },
];

/** The destination for a `g <key>` chord, or null if the key isn't bound. */
export function gChordHref(key: string): string | null {
  const target = key.toLowerCase();
  return GO_SHORTCUTS.find((shortcut) => shortcut.key === target)?.href ?? null;
}
