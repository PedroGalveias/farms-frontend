import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EventHandler = (event: never) => void;

const listeners = new Map<string, EventHandler>();
const cache = { delete: vi.fn(), keys: vi.fn(), put: vi.fn() };
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
  return {
    event,
    response,
    settle: () => Promise.all(lifetimePromises),
  };
}

beforeEach(async () => {
  vi.resetModules();
  listeners.clear();
  cache.put.mockReset().mockResolvedValue(undefined);
  cache.keys.mockReset().mockResolvedValue([]);
  cache.delete.mockReset().mockResolvedValue(true);
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

    const { event, response, settle } = await dispatchFetch(
      new Request("https://farms.test/_next/static/chunk.js"),
    );

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    await settle();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("returns a cached asset immediately and refreshes it in the background", async () => {
    const cached = new Response("cached");
    cachesMock.match.mockResolvedValue(cached);
    let resolveFetch: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const request = new Request("https://farms.test/_next/static/chunk.js");
    const { event, response, settle } = await dispatchFetch(request);

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    await expect(response.text()).resolves.toBe("cached");
    expect(cache.put).not.toHaveBeenCalled();

    resolveFetch!(new Response("fresh"));
    await settle();

    expect(cache.put).toHaveBeenCalledWith(request, expect.any(Response));
    const cachedResponse = vi.mocked(cache.put).mock.calls[0][1];
    await expect(cachedResponse.text()).resolves.toBe("fresh");
  });

  it("evicts the oldest dynamic entries once the cache is bounded", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("fresh"));
    const cachedRequests = Array.from(
      { length: 82 },
      (_, index) => new Request(`https://farms.test/page-${index}`),
    );
    cache.keys.mockResolvedValue(cachedRequests);

    const { settle } = await dispatchFetch(
      new Request("https://farms.test/_next/static/chunk.js"),
    );
    await settle();

    expect(cache.delete).toHaveBeenCalledTimes(2);
    expect(cache.delete).toHaveBeenNthCalledWith(1, cachedRequests[0]);
    expect(cache.delete).toHaveBeenNthCalledWith(2, cachedRequests[1]);
  });
});

describe("service worker activation messages", () => {
  it("accepts an empty event.origin when the source client is same-origin", () => {
    listeners.get("message")?.({
      data: { type: "SKIP_WAITING" },
      origin: "",
      source: { url: "https://farms.test/directory" },
    } as never);

    expect(
      (self as unknown as { skipWaiting: ReturnType<typeof vi.fn> })
        .skipWaiting,
    ).toHaveBeenCalledOnce();
  });

  it("rejects a cross-origin source client", () => {
    listeners.get("message")?.({
      data: { type: "SKIP_WAITING" },
      origin: "",
      source: { url: "https://evil.test/" },
    } as never);

    expect(
      (self as unknown as { skipWaiting: ReturnType<typeof vi.fn> })
        .skipWaiting,
    ).not.toHaveBeenCalled();
  });
});
