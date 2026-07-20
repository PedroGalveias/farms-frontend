import {
  FarmsApiError,
  getFarmsApiBaseUrl,
  readErrorMessage,
} from "@/lib/backend";
import { normalizeFarmCategories } from "@/lib/categories";
import type { CreateFarmPayload, Farm } from "@/types/farm";

// Re-exported so existing importers of these from farms-service keep working.
export { FarmsApiError, getFarmsApiBaseUrl } from "@/lib/backend";

// A cold Render backend can take tens of seconds to wake. Cap how long we wait
// so a hung backend fails fast (into the cached copy / error UI / a degraded
// status banner) instead of leaving the request — and the page — hanging.
const REQUEST_TIMEOUT_MS = 8000;
const HEALTH_TIMEOUT_MS = 4000;

export async function getFarmsHealth() {
  try {
    // Health must be fresh and snappy, so the status banner reflects a
    // slow/unreachable backend quickly rather than stalling.
    const response = await fetch(`${getFarmsApiBaseUrl()}/health_check`, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Cache tag for the farm list — bust it with revalidateTag(FARMS_CACHE_TAG). */
export const FARMS_CACHE_TAG = "farms";

export async function getFarms(): Promise<Farm[]> {
  let response: Response;
  try {
    response = await fetch(`${getFarmsApiBaseUrl()}/farms`, {
      // Serve the directory from the Next Data Cache (shared across requests and
      // routes) and refresh at most every 5 minutes, instead of hammering the
      // backend on every page view. A successful create busts the tag. The
      // signal only bounds a cache *miss* — cached hits never hit the network.
      next: { revalidate: 300, tags: [FARMS_CACHE_TAG] },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new FarmsApiError(
        "The farms service took too long to respond.",
        504,
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }

  const farms = (await response.json()) as Farm[];
  // Canonicalise category variants ONCE at the boundary so every consumer
  // (facets, quick search, cards, map handoff) sees one vocabulary.
  return farms.map((farm) => ({
    ...farm,
    categories: normalizeFarmCategories(farm.categories ?? []),
  }));
}

export async function createFarm(payload: CreateFarmPayload, cookie?: string) {
  const response = await fetch(`${getFarmsApiBaseUrl()}/farms`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      // Forward the caller's session so the backend can authorize the create
      // if it requires it; harmless when it doesn't.
      ...(cookie ? { cookie } : {}),
    },
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
}
