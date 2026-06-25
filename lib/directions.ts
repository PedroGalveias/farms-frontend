import { parseQuickSearchCoordinates } from "@/lib/quick-search";

export type DirectionsPlatform = "ios" | "android" | "web";

export function detectDirectionsPlatform(
  userAgent: string,
): DirectionsPlatform {
  const agent = userAgent.toLowerCase();
  if (/\b(iphone|ipad|ipod)\b/.test(agent)) {
    return "ios";
  }
  if (agent.includes("android")) {
    return "android";
  }
  return "web";
}

export function directionsUrl(
  coordinates: string,
  platform: DirectionsPlatform = "web",
): string {
  const parsed = parseQuickSearchCoordinates(coordinates);
  const destination = parsed
    ? `${parsed.latitude},${parsed.longitude}`
    : coordinates;

  if (platform === "ios") {
    return `maps://?daddr=${encodeURIComponent(destination)}`;
  }

  if (platform === "android") {
    return `geo:0,0?q=${encodeURIComponent(destination)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
