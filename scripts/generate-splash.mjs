// Generate iOS launch (splash) screens, light AND dark: the brand mark centred
// on the app's canvas — including its ambient green tint — with the "farms."
// wordmark near the bottom (ink + green dot in light, white + green dot in
// dark). iOS picks the image by EXACT pixel match against the device and can
// additionally match prefers-color-scheme, so we emit one pair per device.
//
// Run with: node scripts/generate-splash.mjs
// The layout's appleWebApp.startupImage list must stay in sync with SIZES.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(join(root, "public", "icon.svg"));
const outDir = join(root, "public", "splash");
await mkdir(outDir, { recursive: true });

// [pixel width, pixel height] — portrait, one per current iPhone/iPad class.
export const SIZES = [
  [750, 1334], // iPhone SE 2/3, 8
  [1170, 2532], // iPhone 12/13/14, 16e
  [1179, 2556], // iPhone 14 Pro, 15, 16
  [1206, 2622], // iPhone 16/17 Pro
  [1242, 2688], // iPhone XS Max, 11 Pro Max
  [1260, 2736], // iPhone Air
  [1284, 2778], // iPhone 12/13 Pro Max, 14 Plus
  [1290, 2796], // iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [1320, 2868], // iPhone 16/17 Pro Max
  [828, 1792], // iPhone XR, 11
  [1125, 2436], // iPhone X/XS, 11 Pro, 12/13 mini
  [1620, 2160], // iPad 10.2"
  [1640, 2360], // iPad Air 10.9"
  [1668, 2388], // iPad Pro 11"
  [2048, 2732], // iPad Pro 12.9"
];

const THEMES = {
  light: {
    // The light canvas + the ambient green wash (mirrors body's gradients).
    base: "#f4f4ef",
    glowTop: "rgba(33, 160, 90, 0.30)",
    glowBottom: "rgba(33, 160, 90, 0.22)",
    word: "#14161b",
    dot: "#1c7c47",
  },
  dark: {
    base: "#0e0f12",
    glowTop: "rgba(46, 168, 102, 0.32)",
    glowBottom: "rgba(46, 168, 102, 0.22)",
    word: "#f4f4ef",
    dot: "#2ea866",
  },
};

for (const [width, height] of SIZES) {
  const mark = Math.round(Math.min(width, height) * 0.24);
  const art = await sharp(svg, { density: 384 })
    .resize(mark, mark, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  for (const [theme, c] of Object.entries(THEMES)) {
    // Wordmark sizing: readable but quiet, sitting in the bottom safe zone.
    const wordSize = Math.round(Math.min(width, height) * 0.075);
    const wordY = Math.round(height * 0.9);

    // Background with the ambient green hue + the wordmark, all as one SVG so
    // gradients and text render crisply at exact pixel size.
    const bg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gTop" cx="50%" cy="-10%" r="85%">
          <stop offset="0%" stop-color="${c.glowTop}"/>
          <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <radialGradient id="gBottom" cx="85%" cy="105%" r="80%">
          <stop offset="0%" stop-color="${c.glowBottom}"/>
          <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="${c.base}"/>
      <rect width="100%" height="100%" fill="url(#gTop)"/>
      <rect width="100%" height="100%" fill="url(#gBottom)"/>
      <text x="50%" y="${wordY}" text-anchor="middle"
        font-family="Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
        font-weight="800" font-size="${wordSize}" letter-spacing="-${Math.round(wordSize * 0.04)}"
        fill="${c.word}">farms<tspan fill="${c.dot}">.</tspan></text>
    </svg>`;

    const png = await sharp(Buffer.from(bg))
      .composite([{ input: art, gravity: "centre" }])
      .png()
      .toBuffer();

    const name = `${width}x${height}-${theme}.png`;
    await writeFile(join(outDir, name), png);
    console.log(`splash ${name} (${(png.length / 1024).toFixed(0)} kB)`);
  }
}
