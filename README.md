# farms · frontend

A modern web app for discovering Swiss farms and the fresh produce they sell — browse the full directory, or use **quick search** to find a specific product at the nearest farm, sorted by distance.

This is the frontend for the [`farms`](https://github.com/PedroGalveias/farms) backend service (a Rust API). It's built to mirror the backend's contract so the two evolve together.

<p>
  <a href="https://github.com/PedroGalveias/farms-frontend/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/PedroGalveias/farms-frontend/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/PedroGalveias/farms-frontend/actions/workflows/codeql.yml"><img alt="CodeQL" src="https://github.com/PedroGalveias/farms-frontend/actions/workflows/codeql.yml/badge.svg"></a>
  <a href="https://github.com/PedroGalveias/farms-frontend/actions/workflows/ci.yml"><img alt="Coverage floors (CI-enforced)" src="https://img.shields.io/badge/coverage-%E2%89%A589%25%20stmts%20%C2%B7%20%E2%89%A579%25%20branches-3c873a"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20.19-3c873a">
  <img alt="License: GPL-2.0" src="https://img.shields.io/badge/license-GPL--2.0-blue">
</p>

---

## ✨ Features

- **Farm directory** — searchable (with instant autocomplete), filterable (canton, categories, distance radius), sortable, and paginated for large datasets, with grid, list, and **map** views.
- **Quick search** — a guided, three-step flow (location → products → farms) that returns farms holding the products you want, **sorted by distance, nearest first**. Supports a subcategory picker and seasonal deep links.
- **Browse by canton** — a canton chip rail on the home page that filters the directory in place, plus SEO landing pages for every canton (`/canton/[code]`), the seven great regions (`/region/[key]`), and a canton hub (`/canton`).
- **Per-farm pages** — each farm has its own shareable page (`/farm/[id]`) with a Web Share / copy-link button, copy-address, SEO metadata, and schema.org JSON-LD.
- **Accounts** — email + password login and registration with email verification, backed by BFF route handlers (`app/api/auth/*`) so tokens never touch client JS. Adding a farm requires an account.
- **⌘K command palette** — fuzzy search across farms, products, cantons, pages, and quick actions (theme, shortcuts, animations), built on the native `<dialog>` top layer.
- **Nearest farm** — on request (never on load, for privacy), uses your browser location to surface the single closest farm.
- **Saved & collections** — favorite farms, organize them into named collections, plan visits, and see a "recently viewed" strip; all stored per-device in the browser.
- **Most wanted** — a per-device search-stats card (backend-ready) that surfaces the products you search for most.
- **Seasonal produce** — a date-driven calendar (rebuilt from the official Swiss Farmers calendar) highlighting what's in season in Switzerland right now, to nudge local, lower-impact eating.
- **Add a farm** — a validated create flow (Swiss canton + coordinate checks) that posts back to the API.
- **Internationalization** — English, German, French, Italian, and Swiss Romansh with **locale-aware URLs** (`/de`, `/fr`, `/it`, `/rm`; English canonical and unprefixed), server-rendered per locale with hreflang alternates; the language choice is sticky via cookie.
- **Product landing pages** — SEO pages per product category (`/product/[slug]`) plus a browse-by-product hub (`/product`), cross-linked with the canton pages.
- **Settings** — a native-style preferences page (`/settings`): appearance (light / dark / **follow system** / **sun cycle** — light while the sun is up), language, sound & haptic feedback toggles, and local-data controls.
- **Light & dark mode** — class-based theming with no flash of the wrong theme on load, a circular-reveal theme transition, and a browser/PWA chrome color that follows the resolved theme.
- **Installable PWA** — works offline with a cached directory fallback, app shortcuts, a share target, an in-app update prompt, and iOS launch splash screens for every current device.
- **Liquid-glass design system** — frosted chrome with pointer-following glow and scroll-reactive glint, a site-wide ambient WebGL backdrop (breathing green orbs + caustic light), and a strict GPU budget (repeated cards render glass without live backdrop blur) so it stays smooth on iOS.
- **Native-feeling mobile UI** — floating bottom tab bar, pull-to-refresh, long-press quick actions, card→sheet morphs, and real haptic feedback (Vibration API on Android; the iOS switch-control trick on iPhone).
- **Motion system** — scroll reveals, count-ups, a custom desktop cursor, and view-transition detail sheets. Everything respects `prefers-reduced-motion`, with an in-app "always play animations" override (in the command palette) for machines where the OS setting is off unknowingly.
- **Cross-engine parity** — features are feature-detected with graceful fallbacks and verified on Chromium, Firefox (Gecko), and Safari (WebKit), plus phone profiles (iPhone/Pixel) and a real-Windows CI job.
- **Resilient** — branded error boundaries and a graceful 404, so a backend hiccup never leaves a blank screen.

## 🧱 Tech stack

| Area                 | Choice                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| Framework            | [Next.js 16](https://nextjs.org/) (App Router)                                    |
| UI                   | [React 19](https://react.dev/)                                                    |
| Styling              | [Tailwind CSS 4](https://tailwindcss.com/)                                        |
| Language             | [TypeScript 6](https://www.typescriptlang.org/)                                   |
| Icons                | [lucide-react](https://lucide.dev/) v1                                            |
| Unit/component tests | [Vitest 4](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| End-to-end tests     | [Playwright](https://playwright.dev/)                                             |
| Hosting              | [Render](https://render.com/)                                                     |

## 🚀 Getting started

### Prerequisites

- **Node.js** `^20.19` or `>=22.12` (Node **22 LTS** recommended). The repo ships an [`.nvmrc`](.nvmrc):
  ```bash
  nvm use      # picks up Node 22
  ```
- **npm** (ships with Node).

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env

# 3. Point the app at a backend (defaults to the hosted instance if unset)
#    .env:
#    FARMS_API_BASE_URL=http://localhost:8000
#    # In production also set the public origin (used for canonical URLs,
#    # the sitemap, robots.txt, and JSON-LD). Defaults to localhost in dev:
#    NEXT_PUBLIC_SITE_URL=https://your-domain.example

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app degrades gracefully if the backend is unavailable — the UI still renders with an empty directory and a status banner.

## 📜 Scripts

| Script                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Start the dev server                               |
| `npm run build`         | Production build                                   |
| `npm run start`         | Serve the production build                         |
| `npm run lint`          | ESLint (warnings fail: `--max-warnings 0`)         |
| `npm run typecheck`     | `tsc --noEmit`                                     |
| `npm run format`        | Format the codebase with Prettier                  |
| `npm run format:check`  | Check formatting (used in CI)                      |
| `npm test`              | Run unit/component tests once                      |
| `npm run test:watch`    | Tests in watch mode                                |
| `npm run test:coverage` | Tests with a coverage report (enforces thresholds) |
| `npm run test:e2e`      | Playwright end-to-end smoke tests                  |

## 🧪 Testing

- **Unit & component tests** ([Vitest](https://vitest.dev/) + Testing Library, jsdom) live next to the code in `__tests__/` folders. They cover the `lib/` logic (distance sorting, validation, i18n), key components, and the health API route.
- **Coverage** is scoped to the modules under test and **enforces thresholds** (statements 89%, branches 79%, functions 88%, lines 89%) — `npm run test:coverage` fails if coverage regresses. An HTML report is written to `coverage/`.
- **End-to-end tests** ([Playwright](https://playwright.dev/)) in `e2e/` build and boot the app and assert the core flows across **five projects**: Chromium, Firefox, and WebKit on desktop, plus iPhone (WebKit) and Pixel (Blink) phone profiles for the touch flows (`*.mobile.spec.ts`). First time:
  ```bash
  npx playwright install chromium firefox webkit
  npm run test:e2e
  ```
- **Visual regression** (`e2e/visual.spec.ts`) screenshots the key pages against committed baselines — macOS baselines are generated locally (`npx playwright test visual --update-snapshots`), Linux baselines by the _Visual baselines (linux)_ workflow, and the suite gates CI once Linux baselines exist.

## 🔄 Quality & CI/CD

Every push to `main` and every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```
format:check → lint → typecheck → test (+coverage) → build      (verify job)
             Playwright e2e across all five projects             (e2e job)
        unit tests + build + Windows-Firefox e2e (windows-latest) (windows job)
```

- Pull requests get an automatic **coverage comment**; the HTML report is uploaded as an artifact.
- **Deploy is gated**: a Render deploy is triggered only after `verify`, `e2e`, **and** `windows` pass, and only for a pushed **`v*` version tag** (or a manual `workflow_dispatch`). Pushes to `main` and pull requests run CI but **never deploy**.
- [`codeql.yml`](.github/workflows/codeql.yml) runs CodeQL security analysis; [`audit.yml`](.github/workflows/audit.yml) runs `npm audit` daily and on dependency changes (failing on high/critical advisories in production deps).

### Deployment (Render)

Shipping is **tag-driven**: merge to `main` whenever — that only runs CI. To release, bump `package.json`'s `version` to match the tag you're about to cut (CI blocks the deploy if they differ), then push the tag, which triggers the Render **deploy hook** after CI passes:

```bash
npm version 1.2.3 --no-git-tag-version   # sync package.json first
git commit -am "chore: v1.2.3"
git tag v1.2.3 && git push origin main v1.2.3
```

The footer's displayed version resolves from `git describe --tags` at build time, so tagged builds show the release tag automatically.

- Health check path: `/api/health`.

## 🌍 Internationalization

i18n is **URL-based and server-rendered**: every route lives under `app/[lang]`; English is canonical and unprefixed (`/canton/be`), the other locales carry a prefix (`/de/canton/be`). [`proxy.ts`](proxy.ts) rewrites unprefixed paths to English internally and redirects to the visitor's saved language (cookie). Pages emit hreflang alternates and the sitemap carries language alternates.

Message tables live one file per locale in [`lib/messages/`](lib/messages/), aggregated by [`lib/i18n.ts`](lib/i18n.ts) (server-side `translate()` + `MESSAGES`) with `{var}` interpolation and English fallback. The layout hands **only the active locale's strings** to the client through the RSC payload, so the bundle carries just the English fallback.

Two rules:

- **Client components import locale primitives from [`lib/i18n-core.ts`](lib/i18n-core.ts)**, never from `lib/i18n.ts` — the latter drags all five dictionaries (~110 kB) into the client bundle.
- To **add or change a string**: add the key to _every_ file in `lib/messages/`. A test (`lib/__tests__/i18n.test.ts`) fails the build if any locale is missing a key that English defines.

## 🗂️ Project structure

```
proxy.ts                Locale routing: /de|/fr|/it|/rm pass through, /en → 308,
                        unprefixed → rewrite to English or 307 to the saved language
app/
  [lang]/               EVERY page lives under the locale segment (SSG ×5)
    page.tsx            Server-rendered home — loads farms + service health
    quick-search/       The guided, distance-sorted search experience
    farm/[id]/          Per-farm page (metadata + JSON-LD + photo-gallery template)
    canton/ · region/   SEO landing pages: canton hub, per-canton, per-region
    product/            Browse-by-product hub + per-product landing pages
    saved/ · seasonal/  Saved/collections and the seasonal calendar
    profile/ · settings/ · verify-email/  Account, preferences, verification
    offline/            PWA offline fallback
    [...rest]/          Catch-all → localized 404 (real 404 status)
  sitemap.ts · robots.ts  SEO surface (uses NEXT_PUBLIC_SITE_URL)
  api/health/route.ts   Liveness endpoint for Render and uptime checks
  api/farms/route.ts    Local route handler used by the create flow
  api/auth/*            BFF auth routes (login/register/me/logout — httpOnly cookie)
components/             UI: directory shell, toolbar, cards, dialogs, motion
  auth/ · command/ · canton/ · product/ · settings/  Feature UI
  i18n/ · theme/ · personalization/  Cross-cutting providers (LocalizedLink!)
  motion/ · hero/       Motion system + ambient WebGL backdrop
lib/
  farms-service.ts      Backend access layer
  auth.ts · auth-service.ts  Auth validation + BFF service layer
  quick-search.ts       Distance (Haversine), matching, ranking
  farm-form.ts          Create-form normalization & validation
  farms.ts              Canton/region metadata & formatters
  command.ts            Palette fuzzy matching + ranking
  haptics.ts · motion.ts · sound.ts  Feedback + motion preference gates
  suncycle.ts           Sunrise/sunset for the sun-cycle theme mode
  share.ts · site.ts    Share URLs, meta description, JSON-LD, site origin
  i18n-core.ts          Locale primitives (client-safe, dictionary-free)
  i18n.ts · messages/   Server-side translate() + one dictionary per locale
types/farm.ts           Shared TypeScript contracts
e2e/                    Playwright e2e (3 desktop engines + iPhone/Pixel + visual)
scripts/                Icon + iOS splash generators (sharp)
```

## 🔌 Backend contract

The frontend is built against these [`farms`](https://github.com/PedroGalveias/farms) endpoints:

| Method | Path                                                 | Purpose                                     |
| ------ | ---------------------------------------------------- | ------------------------------------------- |
| `GET`  | `/health_check`                                      | Service health                              |
| `GET`  | `/farms`                                             | List farms (directory filters + pagination) |
| `GET`  | `/farms/{id}`                                        | One farm                                    |
| `POST` | `/farms`                                             | Create a farm                               |
| `GET`  | `/me`                                                | Current session user                        |
| `POST` | `/login` · `/logout` · `/register` · `/verify-email` | Auth lifecycle                              |

`GET /farms` is parsed **shape-tolerantly**: both the taxonomy-aware `{ farms, next_cursor }` page shape (cursor pagination followed automatically) and a plain `Farm[]` array are accepted, so either backend generation works. Farms carry `products[]` (slug, names, group, stock status) and derived `categories[]` when the backend provides them.

`POST /farms` expects `name`, `address`, `canton`, `coordinates`, `categories`, and an `idempotency_key`. The browser submits the farm fields to the local `app/api/farms` route handler, which adds a fresh `idempotency_key` before forwarding to the backend.

Auth goes through the local `app/api/auth/*` BFF handlers, which keep the session token in an `httpOnly` cookie — it is never exposed to client-side JavaScript.

## 🤝 Contributing

Contributions are welcome!

1. **Branch off `main`** (PRs are squash-merged, so keep branches focused).
2. Make your change and **run the checks locally** before pushing:
   ```bash
   npm run format && npm run lint && npm run typecheck && npm test && npm run build
   ```
3. Use clear, **[Conventional Commits](https://www.conventionalcommits.org/)** messages (`feat:`, `fix:`, `chore:`, `test:`, `ci:`, …).
4. Open a pull request. **CI must be green** — the same checks above plus E2E, CodeQL, and coverage thresholds run automatically.

Found a bug or have an idea? [Open an issue](https://github.com/PedroGalveias/farms-frontend/issues).

## 📄 License

Licensed under the **GNU GPL v2** — see [`LICENSE`](LICENSE).

## 🔗 Related

- Backend API: [`PedroGalveias/farms`](https://github.com/PedroGalveias/farms)
