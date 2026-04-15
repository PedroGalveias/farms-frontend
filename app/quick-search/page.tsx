import QuickSearchExperience from "@/components/QuickSearchExperience";
import { FarmsApiError, getFarms, getFarmsHealth } from "@/lib/farms-service";
import type { ServiceStatus } from "@/types/farm";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FarmsApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default async function QuickSearchPage() {
  const [healthResult, farmsResult] = await Promise.allSettled([
    getFarmsHealth(),
    getFarms(),
  ]);

  const farms = farmsResult.status === "fulfilled" ? farmsResult.value : [];
  const loadError =
    farmsResult.status === "rejected"
      ? getErrorMessage(
          farmsResult.reason,
          "Unable to load the farm directory right now.",
        )
      : null;

  let serviceStatus: ServiceStatus = "online";

  if (healthResult.status === "rejected" || !healthResult.value) {
    serviceStatus = "offline";
  } else if (loadError) {
    serviceStatus = "degraded";
  }

  return (
    <QuickSearchExperience
      farms={farms}
      loadError={loadError}
      serviceStatus={serviceStatus}
    />
  );
}
