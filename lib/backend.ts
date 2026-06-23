// Shared access layer for the Rust farms backend: base-URL resolution, the
// typed error, and a consistent way to read an error body. Both the farms
// service and the auth service build on this so they resolve the backend the
// same way and surface errors identically.

const DEFAULT_FARMS_API_BASE_URL = "https://farms-0ivm.onrender.com";

/** Backend origin (no trailing slash). Server-only — never exposed to the browser. */
export function getFarmsApiBaseUrl(): string {
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

/** Read a backend error body as text, falling back to a status-based message. */
export async function readErrorMessage(response: Response): Promise<string> {
  const text = (await response.text()).trim();

  if (text.length > 0) {
    return text;
  }

  return `The farms service returned ${response.status}.`;
}
