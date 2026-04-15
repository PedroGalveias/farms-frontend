import type { CreateFarmPayload, Farm } from "@/types/farm";

const DEFAULT_FARMS_API_BASE_URL = "https://farms-0ivm.onrender.com";

function getFarmsApiBaseUrl() {
  return (process.env.FARMS_API_BASE_URL ?? DEFAULT_FARMS_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export class FarmsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FarmsApiError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response) {
  const text = (await response.text()).trim();

  if (text.length > 0) {
    return text;
  }

  return `The farms service returned ${response.status}.`;
}

export async function getFarmsHealth() {
  try {
    const response = await fetch(`${getFarmsApiBaseUrl()}/health_check`, {
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function getFarms(): Promise<Farm[]> {
  const response = await fetch(`${getFarmsApiBaseUrl()}/farms`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as Farm[];
}

export async function createFarm(payload: CreateFarmPayload) {
  const response = await fetch(`${getFarmsApiBaseUrl()}/farms`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
}
