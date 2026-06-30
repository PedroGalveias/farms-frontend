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
