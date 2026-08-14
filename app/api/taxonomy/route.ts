import { NextResponse } from "next/server";
import { getFarmTaxonomy } from "@/lib/farms-service";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("lang") ?? "";
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  const taxonomy = await getFarmTaxonomy(locale);

  return taxonomy
    ? NextResponse.json(taxonomy)
    : NextResponse.json({ error: "Taxonomy unavailable." }, { status: 503 });
}
