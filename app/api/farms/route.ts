import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  FARMS_CACHE_TAG,
  FarmsApiError,
  createFarm,
  getFarms,
} from "@/lib/farms-service";
import { isSameOrigin } from "@/lib/auth";
import { toDirectoryFarm } from "@/lib/directory";
import type { CreateFarmInput } from "@/types/farm";


function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FarmsApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getErrorStatus(error: unknown) {
  if (error instanceof FarmsApiError) {
    return error.status;
  }

  return 500;
}

function isCreateFarmInput(value: unknown): value is CreateFarmInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CreateFarmInput>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.canton === "string" &&
    typeof candidate.coordinates === "string" &&
    Array.isArray(candidate.categories) &&
    candidate.categories.every((item) => typeof item === "string")
  );
}

/**
 * A cap on `?ids=`, so a hand-written URL cannot ask for a projection of the
 * entire directory. Comfortably above any plausible number of favourites.
 */
const MAX_IDS = 200;

/**
 * `GET /api/farms` — the whole directory.
 *
 * `GET /api/farms?ids=a,b,c` — only those farms, projected to what a card
 * renders. `/saved` uses this: favourites live in the browser, so the server
 * cannot know which farms a visitor wants until the client asks. It used to
 * side-step that by embedding the entire directory in the page (949 KB of HTML
 * against 311 KB for the next largest route) purely so the client could pick a
 * handful of ids out of it.
 *
 * This filters the same cached walk rather than fetching each id separately:
 * `getFarms()` is already shared and revalidated across every route, so
 * selecting from it costs nothing extra upstream, while N calls to
 * `getFarmById` would be N real requests against a free-tier backend.
 */
export async function GET(request: Request) {
  const idsParam = new URL(request.url).searchParams.get("ids");

  try {
    const farms = await getFarms();

    if (idsParam === null) {
      return NextResponse.json(farms);
    }

    const wanted = new Set(
      idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_IDS),
    );

    return NextResponse.json(
      farms.filter((farm) => wanted.has(farm.id)).map(toDirectoryFarm),
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load the farm data.") },
      { status: getErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  // This route forwards the caller's session cookie to the backend. Enforce
  // the same CSRF boundary as the auth mutators before reading an untrusted
  // body or issuing a privileged upstream request.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isCreateFarmInput(body)) {
    return NextResponse.json(
      { error: "Invalid farm payload." },
      { status: 400 },
    );
  }

  try {
    await createFarm(
      {
        ...body,
        idempotency_key: crypto.randomUUID(),
      },
      request.headers.get("cookie") ?? undefined,
    );

    // The directory just changed — drop the cached farm list so the new farm
    // shows up immediately everywhere. ("max" = expire now; Next 16 requires a
    // cache-life profile here.)
    revalidateTag(FARMS_CACHE_TAG, "max");

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to create new farm.") },
      { status: getErrorStatus(error) },
    );
  }
}
