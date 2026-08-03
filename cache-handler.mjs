/**
 * A Redis/Valkey-backed cache handler for Next.js.
 *
 * ## Why this exists
 *
 * `getFarms()` is already cached — `next: { revalidate: 300, tags: [...] }` —
 * so a warm instance serves the directory without touching the backend. What
 * the default filesystem handler does *not* give us:
 *
 * 1. **Survival across deploys and restarts.** Every deploy starts with a cold
 *    cache, so the first visitor after one pays the full pagination walk.
 * 2. **Survival when the backend is asleep.** The API runs on a free Render
 *    instance that spins down; the first request to a cold backend can take
 *    tens of seconds. A cache that outlives the frontend process means that
 *    visitor still gets a directory instead of an empty one.
 * 3. **Sharing between instances.** Today there is one; the moment there are
 *    two, each keeps its own copy and each pays its own misses.
 *
 * (3) is speculative. (1) and (2) are the reasons to do this now.
 *
 * ## Degradation
 *
 * Without `REDIS_URL` this module is never loaded — `next.config.ts` only wires
 * it when the variable is set, so a local `next dev` behaves exactly as before.
 * When it *is* set but Redis is unreachable, every operation falls back to the
 * in-memory map and logs once. A cache is an optimisation; it must never be
 * the reason the site is down.
 */

import { createClient } from "redis";

const PREFIX = process.env.REDIS_CACHE_PREFIX ?? "farms:next:";
const TAG_PREFIX = `${PREFIX}tag:`;

/** Shared across handler instances — Next constructs more than one. */
let clientPromise = null;
let warned = false;

function warnOnce(error) {
  if (warned) return;
  warned = true;
  console.warn(
    "[cache-handler] Redis unavailable; falling back to in-memory cache.",
    error?.message ?? error,
  );
}

async function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (!clientPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Connecting must never block a render for long: a slow cache is
        // worse than no cache, because the visitor waits for both.
        connectTimeout: 1_000,
        // Give up reconnecting rather than retrying forever behind every
        // request. A later cold start will try again.
        reconnectStrategy: (retries) => (retries > 3 ? false : 200 * retries),
      },
    });
    client.on("error", warnOnce);
    clientPromise = client
      .connect()
      .then(() => client)
      .catch((error) => {
        warnOnce(error);
        clientPromise = null;
        return null;
      });
  }
  return clientPromise;
}

export default class RedisCacheHandler {
  /** Fallback store, also the cache when Redis is down. */
  static memory = new Map();

  constructor(options) {
    this.options = options;
  }

  async get(key) {
    const client = await getClient();
    if (!client) return RedisCacheHandler.memory.get(key) ?? null;

    try {
      const raw = await client.get(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);

      // Tag invalidation is recorded as a timestamp per tag rather than by
      // deleting keys: finding every key carrying a tag would mean SCAN over
      // the keyspace on every revalidate. An entry older than the newest
      // revalidation of any tag it carries is stale.
      const tags = entry.tags ?? [];
      if (tags.length > 0) {
        const stamps = await client.mGet(tags.map((t) => TAG_PREFIX + t));
        const newest = Math.max(
          0,
          ...stamps.map((s) => (s ? Number(s) : 0)).filter(Number.isFinite),
        );
        if (newest > entry.lastModified) {
          return null;
        }
      }
      return { lastModified: entry.lastModified, value: entry.value };
    } catch (error) {
      warnOnce(error);
      return RedisCacheHandler.memory.get(key) ?? null;
    }
  }

  async set(key, value, ctx) {
    const entry = {
      lastModified: Date.now(),
      value,
      tags: ctx?.tags ?? [],
    };
    RedisCacheHandler.memory.set(key, {
      lastModified: entry.lastModified,
      value,
    });

    const client = await getClient();
    if (!client) return;

    try {
      // A TTL well past `revalidate` — Next decides freshness, this only stops
      // an abandoned key living forever. Without it a renamed route would
      // leave its entry in Redis indefinitely.
      const ttlSeconds = Number(process.env.REDIS_CACHE_TTL_SECONDS ?? 86_400);
      await client.set(PREFIX + key, JSON.stringify(entry), { EX: ttlSeconds });
    } catch (error) {
      warnOnce(error);
    }
  }

  async revalidateTag(tags) {
    const list = Array.isArray(tags) ? tags : [tags];
    const now = Date.now();

    for (const [key, entry] of RedisCacheHandler.memory) {
      if (entry?.tags?.some((t) => list.includes(t))) {
        RedisCacheHandler.memory.delete(key);
      }
    }

    const client = await getClient();
    if (!client) return;

    try {
      // Stamp each tag with "everything cached before now is stale". O(tags),
      // not O(keyspace).
      await Promise.all(
        list.map((tag) => client.set(TAG_PREFIX + tag, String(now))),
      );
    } catch (error) {
      warnOnce(error);
    }
  }

  resetRequestCache() {
    // Nothing per-request is held: `get` reads Redis every time and Next keeps
    // its own request-scoped memoisation above this layer.
  }
}
