// Generate iOS launch (splash) screens: without apple-touch-startup-image the
// installed PWA cold-launches to a plain white flash. iOS picks the image by
// EXACT pixel match against the device, so we emit one PNG per supported
// portrait size: the brand mark centred on the app's light canvas (#f4f4ef),
// mirroring Android's manifest-derived splash for cross-platform parity.
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

const BACKGROUND = { r: 0xf4, g: 0xf4, b: 0xef, alpha: 1 };

// [pixel width, pixel height] — portrait, one per current iPhone/iPad class.
export const SIZES = [
  [750, 1334], // iPhone SE 2/3, 8
  [1170, 2532], // iPhone 12/13/14, 16e
  [1179, 2556], // iPhone 14 Pro, 15, 16
  [1206, 2622], // iPhone 16 Pro
  [1242, 2688], // iPhone XS Max, 11 Pro Max
  [1284, 2778], // iPhone 12/13 Pro Max, 14 Plus
  [1290, 2796], // iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [1320, 2868], // iPhone 16 Pro Max
  [828, 1792], // iPhone XR, 11
  [1125, 2436], // iPhone X/XS, 11 Pro, 12/13 mini
  [1620, 2160], // iPad 10.2"
  [1640, 2360], // iPad Air 10.9"
  [1668, 2388], // iPad Pro 11"
  [2048, 2732], // iPad Pro 12.9"
];

for (const [width, height] of SIZES) {
  // The mark sits at ~24% of the short edge — quiet, centred, launcher-like.
  const mark = Math.round(Math.min(width, height) * 0.24);
  const art = await sharp(svg, { density: 384 })
    .resize(mark, mark, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const png = await sharp({
    create: { width, height, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: art, gravity: "centre" }])
    .png()
    .toBuffer();

  const name = `${width}x${height}.png`;
  await writeFile(join(outDir, name), png);
  console.log(`splash ${name} (${(png.length / 1024).toFixed(0)} kB)`);
}
