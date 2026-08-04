import { Suspense } from "react";
import type { Metadata } from "next";
import FarmsPageShell from "@/components/FarmsPageShell";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import { localeAlternates } from "@/lib/i18n";
import {
  FarmsApiError,
  getFarmFacets,
  getFarms,
  getFarmsHealth,
} from "@/lib/farms-service";
import { parseDirectoryParams } from "@/lib/directory-params";
import { toDirectoryFarm } from "@/lib/directory";
import { facetsFromApi } from "@/lib/directory-facets";
import type { ServiceStatus } from "@/types/farm";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FarmsApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function generateMetadata(): Metadata {
  return { alternates: localeAlternates("/") };
}

/**
 * The page itself does no awaiting, so it renders — and the response starts
 * flushing — immediately.
 *
 * This route is dynamic (it reads `searchParams`) and its data is the whole
 * directory: a walk bounded by a 25s budget that pays a cold backend's wake-up
 * on page 0. Awaiting that in the page body meant the component suspended
 * before returning anything, so the browser received no markup at all until
 * the walk finished — the layout chrome and the skeleton included, even though
 * neither depends on a single farm.
 *
 * Moving the awaits into a child *inside* the boundary is what makes the
 * `<Suspense>` do its job: the shell and skeleton stream at once, and the
 * directory replaces the skeleton when it arrives.
 */
export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeDirectory searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeDirectory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read the filters on the server so the first paint is already the filtered
  // view. Without this the server rendered the whole directory and the browser
  // corrected it after hydration — a shared /?canton=BE link showed "3155
  // farms" for ~400ms before flipping to 727, and every filtered URL served
  // byte-identical HTML to crawlers.
  const [resolvedParams, [healthResult, farmsResult, facetsResult]] =
    await Promise.all([
      searchParams,
      // Facets ride alongside rather than after: they describe the same data,
      // and serialising them would add a round trip to a route that already
      // waits on the directory walk. `getFarmFacets` resolves to null rather
      // than rejecting, so a backend without the endpoint costs nothing.
      Promise.allSettled([getFarmsHealth(), getFarms(), getFarmFacets()]),
    ]);
  const initialParams = parseDirectoryParams(resolvedParams);

  // Only what the list renders crosses to the browser. The full farms —
  // products included — stay on the server for anything that needs them.
  const farms = (
    farmsResult.status === "fulfilled" ? farmsResult.value : []
  ).map(toDirectoryFarm);
  const apiFacets =
    facetsResult.status === "fulfilled" ? facetsResult.value : null;
  const initialFacets = apiFacets ? facetsFromApi(apiFacets) : undefined;

  const loadError =
    farmsResult.status === "rejected"
      ? getErrorMessage(
          farmsResult.reason,
          "Unable to load the farm data right now.",
        )
      : null;

  let serviceStatus: ServiceStatus = "online";

  if (healthResult.status === "rejected" || !healthResult.value) {
    serviceStatus = "offline";
  } else if (loadError) {
    serviceStatus = "degraded";
  }

  return (
    <FarmsPageShell
      initialFarms={farms}
      initialFacets={initialFacets}
      initialParams={initialParams}
      loadError={loadError}
      serviceStatus={serviceStatus}
    />
  );
}
