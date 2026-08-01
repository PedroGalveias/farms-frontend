import { Suspense } from "react";
import type { Metadata } from "next";
import FarmsPageShell from "@/components/FarmsPageShell";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import { DEFAULT_LOCALE, isLocale, localeAlternates } from "@/lib/i18n";
import { FarmsApiError, getFarms, getFarmsHealth } from "@/lib/farms-service";
import { parseDirectoryParams, toFarmsQuery } from "@/lib/directory-params";
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

export default async function HomePage({
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
  const [{ lang }, resolvedParams] = await Promise.all([params, searchParams]);
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const initialParams = parseDirectoryParams(resolvedParams);
  const [healthResult, farmsResult] = await Promise.allSettled([
    getFarmsHealth(),
    getFarms(locale, toFarmsQuery(initialParams)),
  ]);

  const farms = farmsResult.status === "fulfilled" ? farmsResult.value : [];
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
    <Suspense fallback={<HomeSkeleton />}>
      <FarmsPageShell
        initialFarms={farms}
        initialParams={initialParams}
        loadError={loadError}
        serviceStatus={serviceStatus}
      />
    </Suspense>
  );
}
