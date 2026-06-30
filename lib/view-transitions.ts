// Pure decision helpers for the View Transitions navigation layer. Kept
// framework-free so the branchy "should we intercept / animate this?" logic is
// unit-testable without a real browser (jsdom has no startViewTransition).

/** True for app-internal paths ("/farm/x"), not external or protocol URLs. */
export function isInternalHref(href: string | null | undefined): boolean {
  return (
    typeof href === "string" && href.startsWith("/") && !href.startsWith("//") // protocol-relative → external
  );
}

export interface ClickContext {
  href: string | null | undefined;
  target: string | null | undefined;
  download: boolean;
  /** Mouse button; only a primary (0) click should be hijacked. */
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  /** Current location as pathname + search, to skip no-op navigations. */
  currentUrl: string;
}

/**
 * Whether a link click should be taken over for an animated client navigation.
 * Anything that the browser should handle natively — new tabs, downloads,
 * modified clicks, external links, or navigating to where we already are — is
 * left alone.
 */
export function shouldInterceptClick(context: ClickContext): boolean {
  if (context.defaultPrevented) return false;
  if (context.button !== 0) return false;
  if (
    context.metaKey ||
    context.ctrlKey ||
    context.shiftKey ||
    context.altKey
  ) {
    return false;
  }
  if (context.target && context.target !== "_self") return false;
  if (context.download) return false;
  if (!isInternalHref(context.href)) return false;
  if (context.href === context.currentUrl) return false;
  return true;
}

/** Runtime capability check (feature detection, not UA sniffing). */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as Document).startViewTransition === "function"
  );
}

export interface AnimateOptions {
  supported: boolean;
  reducedMotion: boolean;
}

/**
 * Whether to wrap a navigation in a view transition. Requires platform support
 * and respects the user's reduced-motion preference; otherwise the caller
 * navigates instantly (a pure progressive enhancement).
 */
export function shouldAnimateNavigation(options: AnimateOptions): boolean {
  return options.supported && !options.reducedMotion;
}
