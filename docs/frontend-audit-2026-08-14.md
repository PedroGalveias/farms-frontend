# Frontend audit — what needs to be done

> **Current status (2026-08-15):** the branch
> `fix/frontend-audit-2026-08-14` implements the original findings below. A
> second full verification pass found additional issues; see
> [Follow-up audit — 2026-08-15](#follow-up-audit--2026-08-15). This file remains
> the single audit/backlog source of truth.

**Repo:** `farms-frontend` @ `ae61977` (main, clean tree) · **Audited:** 2026-08-14
**Method:** every claim below came from running the code — a production build, a real
request, a real browser, or the live backend. Where I suspected a bug and it turned
out not to be one, it is recorded in *[Checked, not a problem](#checked-not-a-problem)*
so the next pass doesn't re-litigate it.

**Baseline health:** `typecheck` ✅ · `lint` (0 warnings) ✅ · `vitest` ✅ all pass ·
coverage 92.8% stmts / 84.6% branches. **The static gates are all green — every
finding below is behavioural or structural, which is exactly why none of them are
caught today.**

This supersedes [`frontend-gaps.md`](./frontend-gaps.md) (2026-08-01), which predates
~10 merged PRs and whose bucket-B blockers have since shipped. See
[Status changes since that doc](#status-changes-since-the-2026-08-01-doc).

---

## Priority order

| # | Finding | Severity | Effort |
| --- | --- | --- | --- |
| 1 | [Filtered URLs are a dead end](#1-filtered-urls-are-a-dead-end) | 🔴 P0 | M |
| 2 | [The build fails intermittently](#2-the-production-build-fails-intermittently) | 🔴 P0 | S |
| 3 | [⌘K downloads the whole directory](#3-k-downloads-the-entire-directory-183-mb) | 🟠 P1 | S |
| 4 | [`/quick-search` ships 2.2 MB](#4-quick-search-ships-22-mb-of-html) | 🟠 P1 | M |
| 5 | [Canton facets: "27 cantons" + a blank option](#5-27-cantons-covered-and-a-blank-filter-option) | 🟠 P1 | XS |
| 6 | [Facet counts read (0) when narrowed](#6-every-canton-reads-0-once-a-filter-is-active) | 🟠 P1 | M |
| 7 | [Mobile tab bar never marks the active tab](#7-the-mobile-tab-bar-never-marks-the-active-tab) | 🟠 P1 | XS |
| 8 | [Locale isn't threaded into 6 of 7 data routes](#8-locale-is-not-threaded-into-6-of-7-data-routes) | 🟡 P2 | S |
| 9 | [`/taxonomy` is live and unused](#9-taxonomy-is-live-translated-and-completely-unused) | 🟡 P2 | M |
| 10 | [Dataset defects reach the UI](#10-dataset-defects-reach-the-ui) | 🟡 P2 | S |
| 11 | [Service worker cache issues](#11-service-worker-caches-18-mb-and-never-evicts) | 🟡 P2 | S |
| 12 | [Hero stats are invisible without JS](#12-hero-stats-render-as-0-in-the-html) | 🟢 P3 | XS |
| 13 | [Smaller items](#13-smaller-items) | 🟢 P3 | — |

---

## 1. Filtered URLs are a dead end

**Severity: P0 — the directory silently shows the wrong data, or none at all.**

Landing on a filtered URL and then touching any filter breaks the directory. Three
symptoms, one root cause. All three reproduced in a production build:

| Steps | Expected | Actual |
| --- | --- | --- |
| `/?canton=BE` → switch canton to Vaud | 96 Vaud farms | **"No farms match the current filters."** — 0 cards |
| `/?canton=BE` → click **Reset** | all 3,155 farms | **727 farms**, presented as the whole directory |
| `/?canton=BE` → open canton picker | real counts | every other canton reads **(0)** |

The second is the worst of the three, because nothing looks wrong: the URL is `/`,
the filter chips are gone, and the page confidently says "727 farms". A visitor is
looking at Bern and being told it is Switzerland.

### Why

Since [#195](https://github.com/PedroGalveias/farms-frontend/pull/195) the server
narrows the fetch when the URL carries `?canton=` / `?cat=`, so
`initialFarms` holds **only the matching subset**. But the client filter model never
learned about that:

- [`useFarmDirectory.ts:178`](components/home/useFarmDirectory.ts#L178) writes filter
  changes with `window.history.replaceState`. That updates the URL **without a Next
  navigation**, so the server never re-runs and no wider data ever arrives.
- Every filter, count and sort is then applied locally against `initialFarms` — a set
  that, on a filtered entry, can only ever shrink.
- `isNarrowed` **is** computed on the server ([`page.tsx:101`](app/[lang]/page.tsx#L101))
  and passed into `FarmsPageShell` — but it is used *only* to guard the offline-cache
  write ([`FarmsPageShell.tsx:97`](components/FarmsPageShell.tsx#L97)). It is never
  passed to `useFarmDirectory`, so the hook doing the filtering cannot know its input
  is partial.

Note this only triggers when `/facets` is reachable — `page.tsx:100` narrows only when
API facets exist. `/facets` went live between the last audit and this one, which is
why this is a *new* failure mode rather than a long-standing one.

### Fix

A filter change that could **widen** the result set must go through the server.
Options, cheapest first:

1. **Navigate instead of `replaceState`** when `isNarrowed` — `router.replace(url)`
   re-runs the server component with the new query. Keeps one code path; costs a round
   trip per filter change on filtered entries only.
2. **Pass `isNarrowed` into the hook** and have it refetch (via `/api/farms`) whenever
   the new query is not a strict subset of the current one.
3. **Never narrow the canton/category fetch** and accept the full walk on filtered
   entries — reverts the #195 win, so only worth it as a stopgap.

Whichever is chosen, add an e2e case: *land on `/?canton=BE`, switch to VD, assert
non-zero results*. Nothing in `e2e/server-side-filtering.spec.ts` covers the
land-then-change sequence today, which is why this shipped.

---

## 2. The production build fails intermittently

**Severity: P0 — non-deterministic deploys.**

`npm run build` failed on the first run of this audit and passed on the second, with
no code change between them:

```
Error: Route "/[lang]/region/[key]": Uncached data was accessed outside of <Suspense>.
Error occurred prerendering page "/it/region/region_mittelland".
Export encountered an error on /[lang]/region/[key]/page, exiting the build.
⨯ Next.js build worker exited with code: 1
```

Two compounding causes:

**a) `/region/[key]` has no Suspense boundary.**
[`region/[key]/page.tsx:69`](app/[lang]/region/[key]/page.tsx#L69) awaits
`safeGetFarms()` directly in the component body. Its `try/catch` does **not** help —
that is the same lesson already written into
[`farms-service.ts:276-288`](lib/farms-service.ts#L276): an error inside a `use cache`
function fails the prerender even when the caller catches it. When the backend
degrades mid-build, `getFarms` takes its `DEGRADED_CACHE_LIFE` path, the data counts as
uncached, and the prerender dies.

Only the home page has a boundary. Coverage across the data routes:

| Route | `<Suspense>` | `loading.tsx` | Protected |
| --- | :-: | :-: | :-: |
| `/` | ✅ | — | ✅ |
| `/quick-search` | — | ✅ | ✅ |
| `/farm/[id]` | — | ✅ | ✅ |
| `/canton` | — | — | ❌ |
| `/canton/[code]` | — | — | ❌ |
| `/product` | — | — | ❌ |
| `/product/[slug]` | — | — | ❌ |
| `/region/[key]` | — | — | ❌ |

`/region/[key]` is simply the one that lost the race; the other four are the same
latent bug.

**b) The build is coupled to a flaky free-tier backend.** The failing build logged
real upstream 500s:

```
[farms] page 2 failed after 200 farms; serving partial directory
  FarmsApiError: Failed to load farm categories. { status: 500 }
```

The backend also takes **13.3 s** to answer a cold `/health_check`. `getFarms` tolerates
partial failure by design, but "partial" is precisely what trips (a).

### Fix

- Wrap the five unprotected routes' data access in `<Suspense>` (or add
  `loading.tsx`), mirroring [`app/[lang]/page.tsx:59-64`](app/[lang]/page.tsx#L59).
  This alone makes the build survive a degraded backend.
- Consider whether `/region/[key]` and `/canton/[code]` need the whole directory at
  all — both only compute per-canton **counts**, which `/facets` now serves directly.
  That would remove the dependency rather than defer it.

---

## 3. ⌘K downloads the entire directory (1.83 MB)

**Severity: P1.**

[`CommandPalette.tsx:138`](components/command/CommandPalette.tsx#L138) fetches
`/api/farms` with no projection the first time the palette opens. Measured:

```
GET /api/farms → 200 · 1,829,018 bytes · 3,155 farms · 259,820 bytes gzipped
```

It ships every farm's full `products[]` array — which the palette never reads; it
searches names and cantons only. This is the same pattern PRs
[#181](https://github.com/PedroGalveias/farms-frontend/pull/181),
[#185](https://github.com/PedroGalveias/farms-frontend/pull/185),
[#187](https://github.com/PedroGalveias/farms-frontend/pull/187),
[#191](https://github.com/PedroGalveias/farms-frontend/pull/191) and
[#198](https://github.com/PedroGalveias/farms-frontend/pull/198) removed everywhere
else. The palette was missed.

### Fix

Give `/api/farms` a projected mode and use it here — `toDirectoryFarm` already exists
and is already applied on the `?ids=` branch
([`route.ts:90`](app/api/farms/route.ts#L90)); the unprojected branch at
[`route.ts:78`](app/api/farms/route.ts#L78) is the one that returns everything. A
`{id, name, canton}` projection is a fraction of the payload. Better still, back the
palette with a search endpoint so it never holds the directory in memory.

While there: `GET /api/farms` is a public, uncapped endpoint returning the full
dataset on every call. The `?ids=` branch caps at `MAX_IDS = 200`; the bare branch caps
at nothing.

---

## 4. `/quick-search` ships 2.2 MB of HTML

**Severity: P1 — this is the app's flagship feature and its heaviest page.**

Production payloads, measured from `next start`:

| Route | raw | gzip |
| --- | ---: | ---: |
| **`/quick-search`** | **2,228,436 B** | **291,809 B** |
| `/` | 1,121,551 B | 231,931 B |
| `/seasonal` | 486,181 B | 26,350 B |
| `/canton` | 131,835 B | 19,271 B |
| `/saved` | 74,936 B | 15,932 B |

[`quick-search/page.tsx:20`](app/[lang]/quick-search/page.tsx#L20) passes the **full**
`getFarms()` result — farms *with* `products[]` — straight into a client component. No
`toDirectoryFarm`, no projection.

`/saved` had exactly this shape (2.1 MB) and #187/#191 took it to 75 KB. Quick search
genuinely *needs* product data (that is what it searches), so the fix is a narrower
projection rather than removal: products reduced to the slugs/statuses the matcher
actually reads, farm fields trimmed to what the cards render. `lib/quick-search.ts`
defines exactly which fields those are.

Worth noting `performance-audit-3.md` concluded "the easy wins are gone" — that audit
measured `en/saved.html` and the shared JS baseline, and did not measure this route.

---

## 5. "27 cantons covered" and a blank filter option

**Severity: P1 — wrong number on the homepage, visible garbage in the picker. One-line fix.**

Switzerland has 26 cantons. The homepage hero says **27**.

The backend's `/facets` returns a canton bucket for farms with no canton:

```jsonc
// GET /facets?lang=en
{ "code": "", "count": 10 }
```

[`directory-facets.ts:124-127`](lib/directory-facets.ts#L124) filters on `count > 0`
but never on a non-empty code:

```ts
cantons: api.cantons
  .filter((entry) => entry.count > 0)   // ← passes { code: "", count: 10 }
  .map((entry) => entry.code)
```

The farm-derived path does it correctly —
[`farms.ts:87-89`](lib/farms.ts#L87) filters `code.length > 0`. So the two facet paths
disagree, which is the exact failure mode `directory-facets.ts`'s own doc comment warns
about. Consequences:

- hero reads "27 cantons covered"
- the canton listbox ends with a blank entry rendering as **`· (0)`** (confirmed in
  the browser, last option in the list)

### Fix

Add `.filter((entry) => entry.code.trim().length > 0)` in `facetsFromApi`, and add a
unit test pinning `facetsFromApi` and `facetsFromFarms` to the same output for the same
data — the asymmetry, not the empty string, is the real defect.

---

## 6. Every canton reads (0) once a filter is active

**Severity: P1.** Same root cause as [#1](#1-filtered-urls-are-a-dead-end), separate fix.

On `/?canton=BE`, the canton picker renders:

```
All cantons · GE · Geneva (0) · VD · Vaud (0) · VS · Valais (0)
· BE · Bern (727) · FR · Fribourg (0) · … · TI · Ticino (0) · · (0)
```

The **options** come from `facets` (whole-directory, correct). The **counts** come from
`cantonCounts`, computed at
[`useFarmDirectory.ts:320`](components/home/useFarmDirectory.ts#L320) from
`initialFarms` — the narrowed subset. So half the mechanism that
[#193](https://github.com/PedroGalveias/farms-frontend/pull/193) introduced landed:
options are whole-directory, counts are not.

Disjunctive faceting means a count answers *"what would I get if I toggled this,
given my other filters"*. Answering "0" for all 25 other cantons is worse than
answering nothing — it tells the visitor the directory is empty everywhere else.

### Fix

Counts for a facet's **own** dimension must come from the whole-directory source when
the fetch was narrowed on that dimension. `/facets` already returns per-canton counts;
use them for the canton dimension whenever `isNarrowed` is true, and keep the local
contextual counts only for dimensions the server did not narrow on.

---

## 7. The mobile tab bar never marks the active tab

**Severity: P1 — visible on every mobile page load. One-line fix.**

[`MobileTabBar.tsx:25`](components/MobileTabBar.tsx#L25):

```ts
const pathname = usePathname();                    // ← "/de/quick-search"
```

[`SideRail.tsx:61`](components/SideRail.tsx#L61), same logic, done right:

```ts
const pathname = unlocalizedPath(usePathname());   // ← "/quick-search"
```

The comparisons below both are `pathname === "/quick-search"`, so the tab bar's never
match once a locale segment is present. Two different broken behaviours:

**On `/de`, `/fr`, `/it`, `/rm`** — `active` is always `undefined`, so `activeRef` is
`null` and `useSlidingIndicator` sets `opacity: 0`. **No active tab indication at all.**
Confirmed on `/de/quick-search`: `indicatorOpacity: "0"`, `aria-current: null` on all
three links.

**On English (unprefixed)** — the client sees `/quick-search` and the indicator moves
correctly, but the server rendered with `/en/quick-search`, so the markup carries the
*inactive* classes. React does not patch `className`/`aria-current` on hydration, so
the DOM keeps them. The result: the near-white pill (`bg-ink` = `#f1f2ee` in dark mode)
sits under a label still styled `text-ink/60` — **near-white text on a near-white pill,
i.e. an invisible label**, and `aria-current` is never exposed to assistive tech.

Measured on `/quick-search` (production, mobile viewport):

```jsonc
links:     [{href:"/",cur:null},{href:"/quick-search",cur:null},{href:"/saved",cur:null}]
indicator: { opacity:"1", x:164, w:136 }   // pill in the right place, label unstyled
```

### Fix

```ts
const pathname = unlocalizedPath(usePathname());
```

`unlocalizedPath` is already exported from
[`lib/i18n-core.ts:50`](lib/i18n-core.ts#L50). Add an e2e assertion for
`aria-current="page"` on the tab bar in both an unprefixed and a prefixed locale —
`e2e/i18n.spec.ts` is the natural home.

---

## 8. Locale is not threaded into 6 of 7 data routes

**Severity: P2 — latent today, wrong the moment the backend honours `?lang=`.**

Only the home page passes the locale. Everything else defaults to English:

| Caller | Passes locale |
| --- | :-: |
| [`app/[lang]/page.tsx:105`](app/[lang]/page.tsx#L105) | ✅ |
| [`quick-search/page.tsx:20`](app/[lang]/quick-search/page.tsx#L20) | ❌ |
| [`canton/page.tsx:17`](app/[lang]/canton/page.tsx#L17) | ❌ |
| [`canton/[code]/page.tsx:31`](app/[lang]/canton/[code]/page.tsx#L31) | ❌ |
| [`product/page.tsx:16`](app/[lang]/product/page.tsx#L16) | ❌ |
| [`product/[slug]/page.tsx:33`](app/[lang]/product/[slug]/page.tsx#L33) | ❌ |
| [`region/[key]/page.tsx:22`](app/[lang]/region/[key]/page.tsx#L22) | ❌ |
| [`farm/[id]/page.tsx:20`](app/[lang]/farm/[id]/page.tsx#L20) | ❌ |
| `app/api/farms/route.ts:75` | ❌ (no locale available) |

**This is currently invisible**, because the backend ignores `?lang=` for the farm
payload — verified by fetching the same farm at `lang=en|de|fr|it` and getting byte-identical
`categories: ["vegetables"]` and `products: [{name_de, name_en}]` every time. It becomes
a real bug the day the backend starts localising. Thread the locale now, while it costs
one argument per call site.

The previous audit recorded "✅ `?lang=` is sent on every request — ten route files pass
their `[lang]` segment down". That is no longer true of main.

---

## 9. `/taxonomy` is live, translated, and completely unused

**Severity: P2 — unblocks 3 of 5 languages and deletes ~1,100 lines.**

The last audit filed this under "waiting on the backend". **The wait is over:**

```jsonc
// GET /taxonomy?lang=de → 200
{"lang":"de","categories":[{"slug":"fruits","name":"Früchte","translated":true},
                           {"slug":"vegetables","name":"Gemüse","translated":true}, …]}
```

Meanwhile the frontend client for it **has been deleted**. There is no
`getFarmTaxonomy`, no `FarmTaxonomy` type, no `types/taxonomy.ts` — `types/` contains
only `farm.ts`. The old doc's B1 must be rebuilt, not resumed.

What the hardcoded catalogue costs today:

| File | Lines | Holds |
| --- | ---: | --- |
| `lib/products.ts` | 832 | 184 products |
| `lib/categories.ts` | 283 | 13 category groups |

**0 of 184 products carry `fr`, `it` or `rm` labels** — the interface declares
`Partial<Record<Locale,string>> & {de, en}` and every entry supplies only `de`/`en`, so
`produceLabel` ([`seasonal.ts:582`](lib/seasonal.ts#L582)) falls through to English for
French, Italian and Romansh visitors. Categories *are* fully localised in all five
locales, so the gap is products only.

Wiring `/taxonomy` gets category labels from the source of truth, gives products an
*honest* fallback (the API returns `translated: false` rather than pretending), and
lets ~1,100 lines of generated data go. The 549 missing product strings
([farms#162](https://github.com/PedroGalveias/farms/issues/162)) still need a human
translator — that blocks nothing here.

---

## 10. Dataset defects reach the UI

**Severity: P2. Backend/seed data, but the frontend is where they show.**

Measured across all 3,155 farms:

| Defect | Count | Where it shows |
| --- | ---: | --- |
| Empty `canton` | 10 | the blank `· (0)` filter option, "27 cantons" ([#5](#5-27-cantons-covered-and-a-blank-filter-option)) |
| Coordinates at `0,0` (Null Island) | 6 | plotted in the Gulf of Guinea; corrupts "nearest farm" distance sort |
| No categories **and** no products | 897 (**28.4%**) | invisible to every category filter and product search |
| Named literally `"Test"` | 1 | live in production |

No duplicate ids and no out-of-Switzerland coordinates otherwise — the earlier
slug-collision problem is genuinely gone now that ids are UUIDs.

The 28.4% figure is the one worth acting on: more than a quarter of the directory
cannot be found by anything except free-text name search. The frontend can't fix the
data, but it should stop presenting it as complete — and the six Null Island farms
should be filtered out of distance sorting rather than sorted as "closest to everywhere".

---

## 11. Service worker caches 1.8 MB and never evicts

**Severity: P2.** [`public/sw.js`](public/sw.js)

- **`/api/farms` responses are cached by full URL** ([`sw.js:121`](public/sw.js#L121)
  matches on `pathname`, but `caches.match` keys on the query string). Every distinct
  `?ids=…` combination becomes its own entry, and the palette's unprojected 1.8 MB
  response is cached too. Nothing bounds the total.
- **No eviction, ever.** Entries are only dropped when `CACHE_VERSION` changes. Every
  navigated page accumulates for the lifetime of the install.
- **`event.origin` may break the update banner.**
  [`sw.js:43`](public/sw.js#L43) rejects the `SKIP_WAITING` message unless
  `event.origin === self.location.origin`. `ExtendableMessageEvent.origin` is an empty
  string in some engines, which would silently disable "refresh to update" there. The
  check immediately below it — resolving `event.source.url` and comparing origins
  ([`sw.js:53-62`](public/sw.js#L53)) — is the robust one and already fully covers the
  security requirement. Given the cross-engine parity rule, drop the `event.origin`
  test or make it tolerate `""`.

---

## 12. Hero stats render as `0` in the HTML

**Severity: P3.**

[`CountUp.tsx:30`](components/motion/CountUp.tsx#L30) initialises `display = 0` and only
animates on `IntersectionObserver` intersection. So the server HTML contains **"0 farms
listed / 0 cantons covered"**, and it stays 0 for anyone without JS, for crawlers, and
briefly for everyone (the 1.4 s roll — I caught "56 / 0" mid-flight on first paint).

For a marketing hero whose entire job is conveying coverage, the honest default is to
render the real number server-side and let the count-up animate from it (or skip
animating on first paint). `prefersReducedMotion` is already handled correctly.

---

## 13. Smaller items

- **`getFarms()` cache keying.** `cachedFarms(locale, query)` takes an object; whether
  two semantically identical queries with different key insertion order produce one
  cache entry or two is worth confirming — `toFarmsQuery` builds the object with
  conditional spreads, so key order does vary by input.
- **`normalizeFarm` is mapped at six separate return points** in `walkDirectory` /
  `walkSequentially`. One normalise at the boundary would be harder to get wrong.
- **`localStorage` access is hand-rolled in ~15 lib files** (`personalization`,
  `collections`, `trip`, `geolocation`, `recent-searches`, `search-stats`, `motion`,
  `haptics`, `sound`, `seasonal-reminders`, `quick-search`, `offline-farms`…), each with
  its own `try/catch` and JSON handling. None handle `QuotaExceededError` distinctly,
  and the offline farm cache is the one most likely to hit it. A single typed
  `safeStorage<T>(key, schema)` helper would remove the duplication and give quota
  handling one home.
- **`components/quick-search/QuickSearchExperience.tsx` is 756 lines** and
  `useFarmDirectory.ts` is 514 — both are doing state, filtering, URL sync and
  presentation together. Not urgent, but they are where the two P0s live, which is not
  a coincidence.
- **Untranslated leftovers**: a handful of message values are still identical to English
  (`it: profile_account, profile_email`; `rm: toolbar_filters, qs_step_products`).
  Most are legitimate cognates; these few are worth a native check. Key *structure* is
  perfect — all five locales carry exactly the same 469 keys.

---

## Checked, not a problem

Recorded so the next audit doesn't spend time here:

- **Duplicate `<main>` / `<h1>` / `#directory` in the DOM.** Real in `next dev` (a
  leftover React streaming placeholder under `div#S:0`), **absent in production** —
  verified against `next start`: 1 `main`, 1 `h1`, 1 `footer`, 0 duplicate ids.
- **"Empty `<h3>` headings" on farm cards.** An artefact of reading `innerText` on
  `pointer-events-none` nodes; the headings do contain their farm names.
- **`SettingsLink` passing a raw pathname.** Looks like the bug in
  [#7](#7-the-mobile-tab-bar-never-marks-the-active-tab), but `settingsHref` calls
  `unlocalizedPath` internally ([`settings-navigation.ts`](lib/settings-navigation.ts)),
  and `settingsReturnTo` correctly rejects `//` open-redirect targets.
- **`ViewTransitions` using a raw pathname.** It only uses it as a change signal.
- **i18n message catalogues.** All five locales carry an identical key set (469 each) —
  no missing or orphaned keys.
- **`isSameOrigin` CSRF guard.** Correctly applied to both mutating routes
  (`POST /api/farms`, `POST /api/vitals`); allowing an absent `Origin` is documented and
  backed by the `SameSite=Lax` session cookie.
- **Farm id lookups and coordinates.** No duplicate ids; no out-of-Switzerland
  coordinates beyond the 6 Null Island records.

---

## Status changes since the 2026-08-01 doc

| Old finding | Now |
| --- | --- |
| A1 server-side filtering "in progress" | **Shipped** (#195) — and introduced [#1](#1-filtered-urls-are-a-dead-end) and [#6](#6-every-canton-reads-0-once-a-filter-is-active) |
| B "blocked on the i18n stack deploying" | **Unblocked** — `/facets` and `/taxonomy` are both live |
| "The `/taxonomy` client exists" | **No longer true** — client and types deleted; must be rebuilt ([#9](#9-taxonomy-is-live-translated-and-completely-unused)) |
| "`?lang=` is sent on every request" | **No longer true** — 6 of 7 routes dropped it ([#8](#8-locale-is-not-threaded-into-6-of-7-data-routes)) |
| C1 photos / C3 password reset / C4 profile edits / C5 seasonality / C6 reviews | **Unchanged** — still backend-blocked, still accurate |
| D1 549 product translations | **Unchanged** — still needs a human |

The C and D buckets of `frontend-gaps.md` remain valid; keep that document for them.

---

## Suggested sequence

1. **[#7](#7-the-mobile-tab-bar-never-marks-the-active-tab) and
   [#5](#5-27-cantons-covered-and-a-blank-filter-option)** — one line each, both
   user-visible. Ship today.
2. **[#2](#2-the-production-build-fails-intermittently)** — five `<Suspense>` boundaries.
   Until this lands, every deploy is a coin flip against backend health.
3. **[#1](#1-filtered-urls-are-a-dead-end) + [#6](#6-every-canton-reads-0-once-a-filter-is-active)** —
   same root cause, fix together, and add the land-then-change e2e case.
4. **[#3](#3-k-downloads-the-entire-directory-183-mb)** — small, and removes 1.8 MB.
5. **[#4](#4-quick-search-ships-22-mb-of-html)** — the largest remaining payload win.
6. **[#8](#8-locale-is-not-threaded-into-6-of-7-data-routes)** — cheap now, expensive later.
7. **[#9](#9-taxonomy-is-live-translated-and-completely-unused)** — unblocks fr/it/rm and
   deletes ~1,100 lines.
8. **[#10](#10-dataset-defects-reach-the-ui), [#11](#11-service-worker-caches-18-mb-and-never-evicts),
   [#12](#12-hero-stats-render-as-0-in-the-html), [#13](#13-smaller-items)** — as capacity allows.

---

## Follow-up audit — 2026-08-15

**Repo:** `farms-frontend` @ `6329aaa` on
`fix/frontend-audit-2026-08-14` · clean worktree at audit start.

**Evidence gathered:** production build, source review, in-app browser review,
all unit/component tests with coverage, the complete Playwright matrix, npm
security audit, and a real build-time walk against the configured backend.

### Verification baseline

| Gate | Result |
| --- | --- |
| Format | pass |
| ESLint | pass, zero warnings |
| TypeScript | pass |
| Unit/component | 804/804 pass |
| Coverage | 93.80% statements · 85.43% branches · 92.88% functions · 94.60% lines |
| Production build | pass, but logged incomplete backend pagination |
| Playwright | 264 pass · 66 intentionally skipped · Chromium/Firefox/WebKit/iPhone/Pixel/iPad |
| WCAG A/AA axe checks | pass on every covered route/state |
| Production dependency audit | **1 high-severity advisory** (`nanoid <3.3.18`) |

The shell defaulted to Node 20.9.0 even though the repo pins Node 24.18.1.
Vitest therefore failed before collecting tests (`node:util.styleText` is not
available in that Node release). This is a workstation/toolchain mismatch, not
an application failure; every repository gate passes under the pinned runtime.

### Original audit implementation status

| Original item | Status on this branch |
| --- | --- |
| Filtered URLs dead-end | Fixed; narrowed entries now navigate through the server and have regression coverage |
| Intermittent build failures | Fixed; route data is isolated behind Suspense/cache-safe result values |
| Command palette 1.8 MB payload | Fixed with a command projection |
| Quick-search 2.2 MB HTML | Fixed with a purpose-built projection |
| Blank/27th canton | Fixed at the data boundary |
| Narrowed facet counts | Fixed and covered |
| Localized mobile active tab | Fixed and covered |
| Locale missing from data routes | Fixed |
| Live taxonomy unused | Partially fixed: live localized labels are consumed with a durable local fallback; deleting the fallback remains blocked by offline/product-translation requirements |
| Null Island / malformed dataset rows | Defensively handled in location features; source-data cleanup remains a backend task |
| Unbounded service-worker cache | Fixed with a bounded cache and cross-engine update messaging |
| Hero stats render as zero | Fixed; real values are in server HTML |
| Query canonicalization / storage duplication | Fixed with canonical cache args and shared safe-storage helpers |

### New findings and implementation checklist

| ID | Finding | Severity | Owner | Status |
| --- | --- | --- | --- | --- |
| F14 | A timed-out or failed pagination wave returns a partial directory as a plain `Farm[]`; the UI, quick search and sitemap cannot tell it is incomplete. The verified build stopped at 1,400–2,600 farms several times while still reporting success. | P1 | Frontend + backend capacity | Implemented: incomplete snapshots are explicit, the UI enters a degraded state, and the sitemap refuses partial indexes. Backend capacity remains a deployment concern. |
| F15 | The service worker caches navigation URLs containing the single-use `verify-email?token=…` token and Web Share Target payloads. Its generic offline fallback is always `/offline`, so a German/French/Italian/Romansh visitor gets the English offline page. | P1 | Frontend | Implemented and covered |
| F16 | Localized routes still leak English: the localized 404 body, quick-search discovery panel, theme/nav/breadcrumb ARIA names, product-match radiogroup label, custom cursor label, current-location label, and farm dates. Canton names also use one English/ascii table everywhere. | P2 | Frontend + native review for canton names | Partially implemented: frontend copy, ARIA, dates and global/localized 404s are fixed; human-reviewed canton names remain content work. |
| F17 | The directory's **Refresh** button calls only `router.refresh()`. `getFarms()` is behind a five-minute `use cache` entry, so the button normally returns the same data and does not refresh anything. | P2 | Frontend | Implemented with a same-origin cache-revalidation endpoint |
| F18 | The manifest advertises the app as a Web Share Target (`title`, `text`, `url`), but quick search ignores all three parameters. The OS-level feature opens the app without importing the shared intent. | P2 | Frontend | Implemented and manually verified |
| F19 | **Clear recently viewed** removes storage without updating provider state, so recently viewed UI remains stale until reload. **Reset local data** omits the visit plan, recent directory searches, last quick search, reminder acknowledgements, and both offline farm caches. | P2 | Frontend | Implemented with centralized user-data keys and live provider updates |
| F20 | `POST /api/farms` validates only JSON types. A bypassed client can forward blank names, invalid canton/coordinate values and empty taxonomy selections. The create dialog also does not associate validation errors with fields or focus the first invalid control. | P2 | Frontend (backend remains authoritative) | Implemented at the frontend boundary and in the form; backend validation remains authoritative |
| F21 | Production dependency graph contains high-severity `nanoid` advisory GHSA-2v37-7h3g-55p8 through PostCSS. A non-breaking lockfile fix is available. | P2 | Frontend | Implemented: lockfile updated to `nanoid` 3.3.18; production audit is clean |
| F22 | The repo requires Node 24, but an unactivated shell can silently run Node 20 and fail tests with a misleading dependency syntax error. | P3 | Tooling/docs | Implemented with pre-script runtime checks and a clear activation error |
| F23 | Several core components are oversized state machines (`QuickSearchExperience` 761 lines, `useFarmDirectory` 549, `DirectoryToolbar` 523, `AuthModal` 553, `farms-service` 777). Tests are strong, but feature state, URL state, network orchestration and presentation still share modules. | P3 | Frontend | Backlog |

### Backend- or content-dependent functionality still missing

These are real product gaps, but implementing a fake frontend flow would be
worse than leaving the existing explicit “coming soon” state:

- Password-reset request/consume endpoints.
- Profile email, username and password changes, plus account deletion.
- Farm photos/object storage and the object/variant contract already described
  in the backend implementation guide.
- Opening hours in the API/schema (the source dataset already has sparse data).
- Reviews and moderation.
- Human-reviewed French, Italian and Romansh names for all granular products.
- A reliable `/facets` deployment/capacity plan so the home route never needs a
  32-request full-directory walk merely to render complete filter vocabulary.

### Implementation order for the follow-up

1. F14–F16: data honesty, token privacy/offline locale, and complete route i18n.
2. F17–F21: make advertised controls/features real, harden farm creation, and
   remove the security advisory.
3. F22: make the required runtime easier to activate and diagnose.
4. F23 and backend-dependent items: separate follow-up work; do not mix broad
   component rewrites or unavailable API contracts into correctness fixes.

### Follow-up implementation result

The correctness and safety work from F14–F22 is complete, except for the
content-review portion of F16. The implementation added:

- Explicit complete/incomplete farm snapshots, degraded-state messaging and a
  sitemap guard that will not publish a truncated directory.
- Sensitive-navigation cache exclusions, bounded localized offline fallbacks,
  and protected precache entries in the service worker.
- Complete frontend localization for the audited copy, accessible names, dates,
  local/global 404s and quick-search controls.
- A real cache-revalidating directory refresh and a working Web Share Target
  importer for category/product intent.
- Synchronous personalization clearing, centralized reset coverage for all
  user-owned local data, stronger farm payload validation and accessible form
  errors with first-invalid focus.
- A patched production dependency graph and explicit Node 24 preflight checks.

F23 remains an intentional refactoring backlog item because splitting several
large, well-tested state machines is a separate architecture project, not a safe
correctness patch. The backend/content list above also remains open until those
contracts and reviewed translations exist.

### Post-implementation verification

| Gate | Result |
| --- | --- |
| Format | pass |
| ESLint | pass, zero warnings |
| TypeScript | pass |
| Unit/component | 810/810 pass across 91 files on current `origin/main` |
| Coverage | 93.81% statements · 85.60% branches · 92.88% functions · 94.62% lines |
| Production build | pass; incomplete upstream pagination is now surfaced instead of silently trusted |
| Playwright | Full multi-engine/device run: 263 pass, 66 intentional skips, one transient Chromium listbox timing failure; the exact failed case passed immediately on rerun |
| Manual browser | Localized share import, German offline route, global German 404, responsive overflow and localized accessibility names verified |
| Production dependency audit | pass, zero vulnerabilities |

The final remaining work is therefore explicitly limited to F23 and the
backend/content-dependent functionality list; it is not hidden inside a generic
“open” status.
