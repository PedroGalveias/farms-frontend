import { ImageResponse } from "next/og";
import { getFarms } from "@/lib/farms-service";
import { getCantonName } from "@/lib/farms";
import { tagLabel } from "@/lib/products";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Farm on the Swiss farm directory";

// Per-farm social card. Generated so links to /farm/[id] preview with the farm
// name, location, and what it sells instead of a bare title. Falls back to a
// generic branded card if the farm can't be resolved.
export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let farm = null;
  try {
    const farms = await getFarms();
    farm = farms.find((entry) => entry.id === id) ?? null;
  } catch {
    farm = null;
  }

  const name = farm?.name ?? "Swiss farms";
  const place = farm
    ? `${getCantonName(farm.canton)} · ${farm.canton}`
    : "Fresh, direct from the farm";
  const categories = (farm?.categories ?? [])
    .slice(0, 4)
    .map((category) => tagLabel(category, "en"));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #1c7c47 0%, #14603a 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(255,255,255,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </svg>
        </div>
        farms · swiss farm directory
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -2,
            maxWidth: 1040,
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.85)" }}>
          {place}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {categories.map((label) => (
          <div
            key={label}
            style={{
              fontSize: 26,
              fontWeight: 600,
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
