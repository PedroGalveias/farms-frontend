# farms frontend

A modern Next.js frontend for the [`farms`](https://github.com/PedroGalveias/farms) backend service.

The app is intentionally organized around the backend repository contract so it stays easy to extend as the service grows.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TypeScript

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Point `FARMS_API_BASE_URL` at your backend:

```env
FARMS_API_BASE_URL=http://localhost:8000
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start the local dev server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run build` - create a production build

## Render deployment

This repo now mirrors the backend deployment shape used in
[`PedroGalveias/farms`](https://github.com/PedroGalveias/farms):

- GitHub Actions workflow at `.github/workflows/render.yml`
- deploys on tags matching `v**`
- can also be triggered manually with `workflow_dispatch`
- validates the production build before deployment
- triggers Render using a deploy hook URL stored in GitHub Actions secrets

Required GitHub secret:

- `RENDER_DEPLOY_HOOK_URL`
- Render health check path: `/api/health`

Typical release flow:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Project structure

- `app/page.tsx` - server-rendered entry point that loads farms and service health
- `app/api/health/route.ts` - frontend liveness endpoint for Render and uptime checks
- `app/api/farms/route.ts` - local route handler used by the create flow
- `components/` - UI building blocks for the directory shell, toolbar, cards, and dialog
- `lib/farms-service.ts` - backend access layer
- `lib/farms.ts` - shared formatters and canton metadata
- `lib/farm-form.ts` - form normalization and validation
- `types/farm.ts` - shared TypeScript contracts

## Backend contract

The current frontend is built against the backend repository endpoints:

- `GET /health_check`
- `GET /farms`
- `POST /farms`

`POST /farms` expects:

- `name`
- `address`
- `canton`
- `coordinates`
- `categories`
- `idempotency_key`

The client create flow submits the farm fields to the local Next.js route handler, and that handler adds a fresh `idempotency_key` before forwarding the request to the backend.
