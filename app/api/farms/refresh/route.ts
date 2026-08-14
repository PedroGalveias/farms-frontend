import { revalidateTag } from "next/cache";
import { isSameOrigin } from "@/lib/auth";
import {
  FACETS_CACHE_TAG,
  FARMS_CACHE_TAG,
  TAXONOMY_CACHE_TAG,
} from "@/lib/farms-service";

/** Bust the server-side directory snapshot before the client refreshes it. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  revalidateTag(FARMS_CACHE_TAG, "max");
  revalidateTag(FACETS_CACHE_TAG, "max");
  revalidateTag(TAXONOMY_CACHE_TAG, "max");
  return new Response(null, { status: 204 });
}
