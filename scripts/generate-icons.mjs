// Rasterize the brand SVG into the PNGs the manifest references. SVG manifest
// icons are ignored by iOS/Safari for Add-to-Home-Screen and don't drive the
// Android install splash, so we ship real PNGs for cross-engine parity:
//   icon-192.png / icon-512.png   — standard "any" icons
//   icon-maskable-512.png         — full-bleed art inside the safe zone, on a
//                                   solid background (maskable must not be
//                                   transparent or the launcher crops to junk).
//
// Run with: node scripts/generate-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(join(root, "public", "icon.svg"));

async function emit(name, size, { padding = 0, background } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const art = await sharp(svg, { density: 384 })
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Maskable: composite the art over a solid green square so the whole canvas
  // is opaque (the launcher mask crops it). "any": keep the art's own
  // transparent corners by sitting it on a transparent base.
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  const out = join(root, "public", name);
  await writeFile(
    out,
    await base
      .composite([{ input: art, gravity: "center" }])
      .png()
      .toBuffer(),
  );
  console.log(`wrote public/${name} (${size}×${size})`);
}

// The brand mark already has rounded corners + its own background, so the
// standard icons are edge-to-edge. The maskable adds ~10% safe-zone padding on
// the brand green so launchers can crop to a circle/squircle cleanly.
await emit("icon-192.png", 192);
await emit("icon-512.png", 512);
await emit("icon-maskable-512.png", 512, {
  padding: 0.1,
  background: { r: 0x32, g: 0x91, b: 0x64, alpha: 1 },
});
