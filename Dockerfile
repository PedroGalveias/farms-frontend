# Multi-stage build for the Next.js app, shipping the standalone output only.
# Mirrors the backend's containerisation: a small runtime image published to
# GHCR on a version tag (see .github/workflows/docker-publish.yml).

# ── deps: install with a clean, reproducible lockfile ────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build: compile the app, producing .next/standalone ───────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# The build resolves the version from git describe; pass it in explicitly since
# the Docker context has no .git. Falls back to "dev" when unset.
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
RUN npm run build

# ── runner: minimal runtime, non-root, binds 0.0.0.0:$PORT ───────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# standalone bundles the traced node_modules + a server.js entrypoint; public/
# and the static chunks are copied alongside it (Next does not trace those).
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# server.js honours PORT + HOSTNAME, so the container binds 0.0.0.0:$PORT —
# the same requirement that keeps Render's port scan happy.
CMD ["node", "server.js"]
