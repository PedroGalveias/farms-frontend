import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FarmDetail from "@/components/FarmDetail";
import { getFarms } from "@/lib/farms-service";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { farmMetaDescription } from "@/lib/share";
import type { Farm } from "@/types/farm";

export const dynamic = "force-dynamic";

// There's no single-farm endpoint, so we fetch the list and find the farm.
// Returns null on any failure so the page can render a clean 404.
async function findFarm(id: string): Promise<Farm | null> {
  try {
    const farms = await getFarms();
    return farms.find((farm) => farm.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const farm = await findFarm(id);

  if (!farm) {
    return { title: "Farm not found" };
  }

  const description = farmMetaDescription(farm, DEFAULT_LOCALE);
  return {
    title: farm.name,
    description,
    alternates: { canonical: `/farm/${encodeURIComponent(farm.id)}` },
    openGraph: {
      title: farm.name,
      description,
      type: "website",
      url: `/farm/${encodeURIComponent(farm.id)}`,
    },
    twitter: { card: "summary", title: farm.name, description },
  };
}

export default async function FarmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = await findFarm(id);

  if (!farm) {
    notFound();
  }

  return <FarmDetail farm={farm} />;
}
