import QuickSearchExperience from "@/components/quick-search/QuickSearchExperience";
import { FarmsApiError, getFarms, getFarmsHealth } from "@/lib/farms-service";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
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

export default async function QuickSearchPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const [healthResult, farmsResult] = await Promise.allSettled([
    getFarmsHealth(),
    getFarms(locale),
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
