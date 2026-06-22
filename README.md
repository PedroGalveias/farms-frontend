# farms · frontend

A modern web app for discovering Swiss farms and the fresh produce they sell — browse the full directory, or use **quick search** to find a specific product at the nearest farm, sorted by distance.

This is the frontend for the [`farms`](https://github.com/PedroGalveias/farms) backend service (a Rust API). It's built to mirror the backend's contract so the two evolve together.

<p>
  <a href="https://github.com/PedroGalveias/farms-frontend/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/PedroGalveias/farms-frontend/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/PedroGalveias/farms-frontend/actions/workflows/codeql.yml"><img alt="CodeQL" src="https://github.com/PedroGalveias/farms-frontend/actions/workflows/codeql.yml/badge.svg"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20.19-3c873a">
  <img alt="License: GPL-2.0" src="https://img.shields.io/badge/license-GPL--2.0-blue">
</p>

---

## ✨ Features

- **Farm directory** — searchable, filterable (by canton and category), sortable, and paginated for large datasets.
- **Quick search** — a guided, three-step flow (location → products → farms) that returns farms holding the products you want, **sorted by distance, nearest first**.
- **Nearest farm** — on request (never on load, for privacy), uses your browser location to surface the single closest farm.
- **Seasonal produce** — a date-driven card highlighting what's in season in Switzerland right now, to nudge local, lower-impact eating.
- **Add a farm** — a validated create flow (Swiss canton + coordinate checks) that posts back to the API.
- **Internationalization** — English, German, French, Italian, and Swiss Romansh, switchable at runtime.
- **Light & dark mode** — class-based theming with no flash of the wrong theme on load.
- **Native-feeling mobile UI** — a slim header and a floating bottom tab bar.
- **Motion system** — scroll reveals, count-ups, a custom desktop cursor, and view-transition detail sheets (all respect `prefers-reduced-motion`).

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
- **Coverage** is scoped to the modules under test and **enforces thresholds** (lines/statements 85%, functions 85%, branches 75%) — `npm run test:coverage` fails if coverage regresses. An HTML report is written to `coverage/`.
- **End-to-end tests** ([Playwright](https://playwright.dev/)) in `e2e/` build and boot the app in a real browser and assert the core flows. First time:
  ```bash
  npx playwright install chromium
  npm run test:e2e
  ```

## 🔄 Quality & CI/CD

Every push to `main` and every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```
format:check → lint → typecheck → test (+coverage) → build      (verify job)
                          Playwright smoke tests                  (e2e job)
```

- Pull requests get an automatic **coverage comment**; the HTML report is uploaded as an artifact.
- **Deploy is gated**: a Render deploy is triggered only after `verify` **and** `e2e` pass, and only on `main` (pull requests never deploy).
- [`codeql.yml`](.github/workflows/codeql.yml) runs CodeQL security analysis; [`audit.yml`](.github/workflows/audit.yml) runs `npm audit` daily and on dependency changes (failing on high/critical advisories in production deps).

### Deployment (Render)

Deploys are triggered by a Render **deploy hook** after CI passes on `main`.

- Health check path: `/api/health`.

## 🌍 Internationalization

UI copy lives in [`lib/i18n.ts`](lib/i18n.ts) as a dictionary per locale (`en`, `de`, `fr`, `it`, `rm`), with `{var}` interpolation and English fallback. The backend is not locale-aware — translation is entirely client-side.

To **add or change a string**: add the key to every locale in `MESSAGES`. A test (`lib/__tests__/i18n.test.ts`) fails the build if any locale is missing a key that English defines, so gaps can't slip through.

## 🗂️ Project structure

```
app/
  page.tsx              Server-rendered home — loads farms + service health
  quick-search/         The guided, distance-sorted search experience
  api/health/route.ts   Liveness endpoint for Render and uptime checks
  api/farms/route.ts    Local route handler used by the create flow
components/             UI: directory shell, toolbar, cards, dialogs, motion
  i18n/ · theme/        Language and theme providers
lib/
  farms-service.ts      Backend access layer
  quick-search.ts       Distance (Haversine), matching, ranking
  farm-form.ts          Create-form normalization & validation
  farms.ts              Canton metadata & formatters
  i18n.ts               Translation dictionary
types/farm.ts           Shared TypeScript contracts
e2e/                    Playwright end-to-end tests
```

## 🔌 Backend contract

The frontend is built against these [`farms`](https://github.com/PedroGalveias/farms) endpoints:

| Method | Path            | Purpose        |
| ------ | --------------- | -------------- |
| `GET`  | `/health_check` | Service health |
| `GET`  | `/farms`        | List farms     |
| `POST` | `/farms`        | Create a farm  |

`POST /farms` expects `name`, `address`, `canton`, `coordinates`, `categories`, and an `idempotency_key`. The browser submits the farm fields to the local `app/api/farms` route handler, which adds a fresh `idempotency_key` before forwarding to the backend.

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
