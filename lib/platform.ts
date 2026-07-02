// Tiny, testable OS check for choosing the keyboard-shortcut modifier label.
// The shortcut *handling* accepts both Cmd and Ctrl everywhere; this only picks
// what we *show* — ⌘ on Apple platforms, Ctrl on Windows/Linux.

/** Whether the platform is Apple (Mac / iPad / iPhone), where ⌘ is the primary
 *  shortcut modifier rather than Ctrl. */
export function isApplePlatform(source: {
  platform?: string | null;
  userAgent?: string | null;
}): boolean {
  const haystack = `${source.platform ?? ""} ${source.userAgent ?? ""}`;
  return /mac|iphone|ipad|ipod/i.test(haystack);
}

/**
 * Whether a mouse-like pointer is available. Checks the primary pointer first
 * and falls back to any-pointer: Firefox on touch-capable Windows hardware
 * misreports the *primary* pointer as coarse/hover-none even with a mouse
 * attached, which used to disable the custom cursor and hover effects there.
 */
export function hasFinePointer(win: Pick<Window, "matchMedia">): boolean {
  return (
    win.matchMedia("(hover: hover) and (pointer: fine)").matches ||
    win.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches
  );
}
