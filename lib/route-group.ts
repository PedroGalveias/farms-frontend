import { LOCALE_CODES } from "@/lib/i18n-core";

/**
 * Every route template the app serves, as a metric label.
 *
 * A closed list, not a derivation. Labels on a metric are cardinality, and
 * cardinality is what a time-series backend charges for and chokes on — the
 * pathname a beacon carries is attacker-controllable, so anything not on this
 * list has to collapse to one bucket rather than become a new series.
 */
export const ROUTE_GROUPS = [
  "/",
  "/canton",
  "/canton/[code]",
  "/farm/[id]",
  "/haptics-lab",
  "/offline",
  "/product",
  "/product/[slug]",
  "/profile",
  "/quick-search",
  "/region/[key]",
  "/saved",
  "/seasonal",
  "/settings",
  "/verify-email",
  /** Anything unrecognised, including a 404 and a hand-written URL. */
  "other",
] as const;

export type RouteGroup = (typeof ROUTE_GROUPS)[number];

const GROUPS = new Set<string>(ROUTE_GROUPS);

/** Static routes, matched exactly after the locale prefix is removed. */
const STATIC_ROUTES = new Set([
  "/",
  "/canton",
  "/haptics-lab",
  "/offline",
  "/product",
  "/profile",
  "/quick-search",
  "/saved",
  "/seasonal",
  "/settings",
  "/verify-email",
]);

/** One dynamic segment under a known parent. */
const DYNAMIC_PARENTS: Record<string, RouteGroup> = {
  canton: "/canton/[code]",
  farm: "/farm/[id]",
  product: "/product/[slug]",
  region: "/region/[key]",
};

/**
 * Fold a pathname to the route template it was served by.
 *
 * Why a template and not the path: `/canton/be`, `/canton/zh` and 24 others are
 * one page with one performance profile. Recorded separately they are 26 series
 * that each see a twenty-sixth of the traffic — and a p75 needs samples to mean
 * anything, so splitting them is how you end up with 26 numbers and no signal.
 *
 * The locale prefix goes the same way: `/de/canton/be` and `/canton/be` are the
 * same page, and English is unprefixed, so keeping the prefix would make one
 * route look like five.
 */
export function routeGroupFor(pathname: string): RouteGroup {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    return "other";
  }

  // Query and hash are not part of the route, and a query string is free-text
  // that must never reach a label.
  const path = pathname.split(/[?#]/)[0];

  const segments = path.split("/").filter(Boolean);

  // Drop a leading locale. English is unprefixed, so this is optional.
  if (segments.length > 0 && (LOCALE_CODES as string[]).includes(segments[0])) {
    segments.shift();
  }

  if (segments.length === 0) {
    return "/";
  }

  if (segments.length === 1) {
    const candidate = `/${segments[0]}`;
    return STATIC_ROUTES.has(candidate) ? (candidate as RouteGroup) : "other";
  }

  if (segments.length === 2) {
    return DYNAMIC_PARENTS[segments[0]] ?? "other";
  }

  return "other";
}

/** Whether a string is one of the known groups — used to validate input. */
export function isRouteGroup(value: string): value is RouteGroup {
  return GROUPS.has(value);
}
