import { Suspense } from "react";
import type { Metadata } from "next";
import FarmsPageShell from "@/components/FarmsPageShell";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import { DEFAULT_LOCALE, isLocale, localeAlternates } from "@/lib/i18n";
import {
  FarmsApiError,
  getFarmFacets,
  getFarms,
  getFarmsHealth,
} from "@/lib/farms-service";
import {
  narrowsTheDirectory,
  parseDirectoryParams,
  toFarmsQuery,
} from "@/lib/directory-params";
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
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeDirectory params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeDirectory({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read the filters on the server so the first paint is already the filtered
  // view. Without this the server rendered the whole directory and the browser
  // corrected it after hydration — a shared /?canton=BE link showed "3155
  // farms" for ~400ms before flipping to 727, and every filtered URL served
  // byte-identical HTML to crawlers.
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  const [resolvedParams, apiFacets] = await Promise.all([
    searchParams,
    // Facets come FIRST, and the farm fetch depends on them. That ordering is
    // the whole safety mechanism: the picker's options and counts have to
    // describe the entire directory, and if they were derived from a filtered
    // farm list instead, filtering to Bern would leave the canton dropdown
    // offering only Bern and the visitor could not get back out.
    //
    // `getFarmFacets` resolves to null rather than rejecting, so a backend
    // without the endpoint — which is every backend until /facets deploys —
    // simply falls through to fetching everything, exactly as before.
    getFarmFacets(locale),
  ]);
  const initialParams = parseDirectoryParams(resolvedParams);
  const initialFacets = apiFacets ? facetsFromApi(apiFacets) : undefined;

  // Narrow the fetch ONLY when the counts come from somewhere that always sees
  // the whole directory. Without API facets this stays empty and the directory
  // fetches everything, which is slower but never wrong.
  const query = initialFacets ? toFarmsQuery(initialParams) : {};
  const isNarrowed = narrowsTheDirectory(query);

  const [healthResult, farmsResult] = await Promise.allSettled([
    getFarmsHealth(),
    getFarms(locale, query),
  ]);

  // Only what the list renders crosses to the browser. The full farms —
  // products included — stay on the server for anything that needs them.
  const farms = (
    farmsResult.status === "fulfilled" ? farmsResult.value : []
  ).map(toDirectoryFarm);
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
      isNarrowed={isNarrowed}
      loadError={loadError}
      serviceStatus={serviceStatus}
    />
  );
}
