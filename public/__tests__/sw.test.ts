import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EventHandler = (event: never) => void;

const listeners = new Map<string, EventHandler>();
const cache = { put: vi.fn() };
const cachesMock = {
  delete: vi.fn(),
  keys: vi.fn(),
  match: vi.fn(),
  open: vi.fn(),
};

async function loadWorker() {
  // sw.js is deliberately a classic service-worker script, not an ES module.
  // A runtime specifier keeps TypeScript from requiring module exports while
  // Vite can still execute the worker in this isolated global scope.
  const workerPath = "../sw.js";
  await import(/* @vite-ignore */ workerPath);
}

async function dispatchFetch(request: Request) {
  let responsePromise: Promise<Response> | undefined;
  const lifetimePromises: Promise<unknown>[] = [];
  const respondWith = vi.fn((promise: Promise<Response>) => {
    responsePromise = promise;
  });
  const waitUntil = vi.fn((promise: Promise<unknown>) => {
    lifetimePromises.push(promise);
  });
  const event = {
    request,
    respondWith,
    waitUntil,
  };

  listeners.get("fetch")?.(event as never);

  if (!responsePromise) {
    throw new Error("Service worker did not respond to fetch event");
  }

  const response = await responsePromise;
  await Promise.all(lifetimePromises);
  return { event, response };
}

beforeEach(async () => {
  vi.resetModules();
  listeners.clear();
  cache.put.mockReset().mockResolvedValue(undefined);
  cachesMock.delete.mockReset().mockResolvedValue(true);
  cachesMock.keys.mockReset().mockResolvedValue([]);
  cachesMock.match.mockReset().mockResolvedValue(undefined);
  cachesMock.open.mockReset().mockResolvedValue(cache);

  vi.stubGlobal("caches", cachesMock);
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("self", {
    addEventListener: (type: string, handler: EventHandler) => {
      listeners.set(type, handler);
    },
    clients: { claim: vi.fn() },
    location: { origin: "https://farms.test" },
    skipWaiting: vi.fn(),
  });

  await loadWorker();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("service worker asset caching", () => {
  it("does not cache failed static-asset responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("not found", { status: 404 }),
    );

    const { event, response } = await dispatchFetch(
      new Request("https://farms.test/_next/static/chunk.js"),
    );

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("returns a cached asset immediately and refreshes it in the background", async () => {
    const cached = new Response("cached");
    cachesMock.match.mockResolvedValue(cached);
    vi.mocked(fetch).mockResolvedValue(new Response("fresh"));

    const request = new Request("https://farms.test/_next/static/chunk.js");
    const { event, response } = await dispatchFetch(request);

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    await expect(response.text()).resolves.toBe("cached");
    expect(cache.put).toHaveBeenCalledWith(request, expect.any(Response));
    const cachedResponse = vi.mocked(cache.put).mock.calls[0][1];
    await expect(cachedResponse.text()).resolves.toBe("fresh");
  });
});
