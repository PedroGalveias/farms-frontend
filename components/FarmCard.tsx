import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { formatFarmDate, getCantonName, splitCoordinates } from "@/lib/farms";
import type { DirectoryViewMode, Farm } from "@/types/farm";

interface FarmCardProps {
  farm: Farm;
  variant?: DirectoryViewMode;
}

export default function FarmCard({
  farm,
  variant = "grid",
}: FarmCardProps) {
  const { latitude, longitude } = splitCoordinates(farm.coordinates);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    farm.coordinates,
  )}`;
  const visibleCategories =
    variant === "list" ? farm.categories.slice(0, 4) : farm.categories;
  const hiddenCategoriesCount =
    variant === "list" ? farm.categories.length - visibleCategories.length : 0;

  if (variant === "list") {
    return (
      <article className="group relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,239,0.96))] p-5 shadow-[0_18px_46px_rgba(31,42,33,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(31,42,33,0.12)] sm:p-6">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#7ea86c_0%,#e9c96b_52%,#d27a35_100%)]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-meadow/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-forest">
                {farm.canton} · {getCantonName(farm.canton)}
              </span>
              <span className="rounded-full bg-sun/28 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-forest">
                Farm
              </span>
            </div>
            <h3 className="mt-4 text-3xl leading-none text-forest">{farm.name}</h3>
            <p className="mt-3 text-sm leading-7 text-ink/70">{farm.address}</p>
          </div>

          <div className="space-y-3 text-sm text-ink/66">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-forest" />
              <span>Added {formatFarmDate(farm.created_at)}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-forest" />
              <a
                className="inline-flex items-center gap-1 font-medium text-forest transition hover:text-accent"
                href={mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                {latitude}, {longitude}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
            {visibleCategories.map((category) => (
              <span
                className="rounded-full bg-[linear-gradient(135deg,rgba(126,168,108,0.16),rgba(233,201,107,0.22))] px-3 py-1 text-sm font-medium text-forest"
                key={category}
              >
                {category}
              </span>
            ))}
            {hiddenCategoriesCount > 0 ? (
              <span className="rounded-full bg-forest/8 px-3 py-1 text-sm font-medium text-forest">
                +{hiddenCategoriesCount} more
              </span>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,247,239,0.96))] p-6 shadow-[0_22px_55px_rgba(31,42,33,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(31,42,33,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#7ea86c_0%,#e9c96b_48%,#d27a35_100%)]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/55">
            {farm.canton} · {getCantonName(farm.canton)}
          </p>
          <h3 className="mt-3 text-3xl leading-none text-forest">{farm.name}</h3>
        </div>

        <span className="rounded-full bg-sun/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest">
          Directory
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-ink/70">{farm.address}</p>

      <div className="mt-6 space-y-3 text-sm text-ink/65">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-forest" />
          <span>Added {formatFarmDate(farm.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-forest" />
          <a
            className="inline-flex items-center gap-1 font-medium text-forest transition hover:text-accent"
            href={mapsUrl}
            rel="noreferrer"
            target="_blank"
          >
            {latitude}, {longitude}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {farm.categories.map((category) => (
          <span
            className="rounded-full bg-[linear-gradient(135deg,rgba(126,168,108,0.16),rgba(233,201,107,0.22))] px-3 py-1 text-sm font-medium text-forest"
            key={category}
          >
            {category}
          </span>
        ))}
      </div>
    </article>
  );
}
