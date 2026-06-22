import type { MetadataRoute } from "next";

// Web App Manifest — makes the site installable. Served at /manifest.webmanifest
// and auto-linked by Next. The single SVG icon (sizes "any") satisfies install
// requirements on Chromium browsers without shipping rasterized PNGs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swiss farms",
    short_name: "farms",
    description:
      "Fresh products, direct from Swiss farms — find what you need at the farm nearest to you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f4ef",
    theme_color: "#1c7c47",
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
