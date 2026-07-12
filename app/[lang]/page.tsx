import { Suspense } from "react";
import type { Metadata } from "next";
import FarmsPageShell from "@/components/FarmsPageShell";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import { localeAlternates } from "@/lib/i18n";
import { FarmsApiError, getFarms, getFarmsHealth } from "@/lib/farms-service";
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

export default async function HomePage() {
  const [healthResult, farmsResult] = await Promise.allSettled([
    getFarmsHealth(),
    getFarms(),
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
        loadError={loadError}
        serviceStatus={serviceStatus}
      />
    </Suspense>
  );
}
