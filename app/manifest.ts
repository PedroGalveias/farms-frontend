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
    shortcuts: [
      {
        name: "Quick search",
        short_name: "Search",
        description: "Find farms by product and distance.",
        url: "/quick-search",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Saved farms",
        short_name: "Saved",
        description: "Open your saved farms and collections.",
        url: "/saved",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Seasonal calendar",
        short_name: "Seasonal",
        description: "See what's in season now.",
        url: "/seasonal",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
    share_target: {
      action: "/quick-search",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
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
