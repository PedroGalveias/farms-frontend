"use client";

import { useEffect, useRef } from "react";
import {
  CANTONS,
  LAKES,
  MASSIFS,
  OUTLINE,
  RIVERS,
  VIEWBOX,
} from "@/lib/swiss-geo";

/**
 * Switzerland as a detailed shaded-relief map: the real national border and
 * all 26 canton boundaries (geoBoundaries geometry), the major lakes and
 * rivers, and a hypsometric hillshade of the Alps — green Mittelland in the
 * north rising to the snow-capped southern ranges.
 *
 * The relief is rasterised ONCE onto a small 2D canvas from a synthetic DEM
 * (a sum of Gaussian massifs placed at real alpine coordinates) — no animation
 * loop, so it costs nothing after paint and carries none of the iOS
 * animation-layer risk. An inline SVG (accurate outline + canton lines + a
 * vertical hypsometric gradient) renders underneath as the SSR / no-JS base,
 * so the pane is never blank and there's no layout shift.
 */

const { w: VBW, h: VBH } = VIEWBOX;

// Hypsometric colour ramp, low → high. [elevation stop, r, g, b].
const RAMP: [number, number, number, number][] = [
  [0.0, 0x8f, 0xb5, 0x74],
  [0.28, 0xa6, 0xbf, 0x7d],
  [0.46, 0xbc, 0xc6, 0x88],
  [0.6, 0xcb, 0xc6, 0x9d],
  [0.72, 0xc8, 0xc2, 0xb4],
  [0.83, 0xd9, 0xdc, 0xe0],
  [0.93, 0xed, 0xf1, 0xf4],
  [1.3, 0xff, 0xff, 0xff],
];

function ramp(e: number): [number, number, number] {
  for (let i = 1; i < RAMP.length; i++) {
    if (e <= RAMP[i][0]) {
      const a = RAMP[i - 1];
      const b = RAMP[i];
      const t = (e - a[0]) / (b[0] - a[0] || 1);
      return [
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ];
    }
  }
  const last = RAMP[RAMP.length - 1];
  return [last[1], last[2], last[3]];
}

// Build the synthetic elevation field on a low-res grid and return it plus a
// put-image-data-ready relief (hypsometric colour × NW hillshade).
function renderRelief(gw: number, gh: number): ImageData | null {
  if (typeof document === "undefined") return null;
  const off = document.createElement("canvas");
  off.width = gw;
  off.height = gh;
  const octx = off.getContext("2d");
  if (!octx) return null;

  const elev = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    const vy = ((y + 0.5) / gh) * VBH;
    for (let x = 0; x < gw; x++) {
      const vx = ((x + 0.5) / gw) * VBW;
      // Base plateau tilts up slightly toward the south (larger y).
      let e = 0.06 + 0.05 * (vy / VBH);
      for (let m = 0; m < MASSIFS.length; m++) {
        const [mx, my, s, h] = MASSIFS[m];
        const dx = vx - mx;
        const dy = vy - my;
        e += 0.82 * h * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
      }
      elev[y * gw + x] = e;
    }
  }

  // NW light (screen space: north = up/-y, so light comes from -x,-y).
  const lx = -0.53;
  const ly = -0.53;
  const lz = 0.66;
  const img = octx.createImageData(gw, gh);
  const STR = 15; // slope exaggeration
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      const e = elev[i];
      const eL = elev[i - (x > 0 ? 1 : 0)];
      const eR = elev[i + (x < gw - 1 ? 1 : 0)];
      const eU = elev[i - (y > 0 ? gw : 0)];
      const eD = elev[i + (y < gh - 1 ? gw : 0)];
      const dzdx = (eR - eL) * STR;
      const dzdy = (eD - eU) * STR;
      const len = Math.hypot(dzdx, dzdy, 1);
      const nx = -dzdx / len;
      const ny = -dzdy / len;
      const nz = 1 / len;
      let shade = nx * lx + ny * ly + nz * lz + 0.42;
      shade = Math.max(0.66, Math.min(1.12, shade));
      const [r, g, b] = ramp(e);
      const o = i * 4;
      img.data[o] = Math.min(255, r * shade);
      img.data[o + 1] = Math.min(255, g * shade);
      img.data[o + 2] = Math.min(255, b * shade);
      img.data[o + 3] = 255;
    }
  }
  return img;
}

let cachedRelief: { img: ImageData; gw: number; gh: number } | null = null;
function getRelief() {
  if (cachedRelief) return cachedRelief;
  const gw = 240;
  const gh = Math.round((gw * VBH) / VBW);
  const img = renderRelief(gw, gh);
  if (!img) return null;
  cachedRelief = { img, gw, gh };
  return cachedRelief;
}

export default function SwitzerlandRelief({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outer = OUTLINE[0] ? new Path2D(OUTLINE[0]) : null;
    const outlineAll = new Path2D();
    for (const d of OUTLINE) outlineAll.addPath(new Path2D(d));
    const cantonPaths = CANTONS.map((d) => new Path2D(d));
    const lakePaths = LAKES.map((d) => new Path2D(d));
    const riverPaths = RIVERS.map((d) => new Path2D(d));

    // Offscreen relief bitmap (rendered once, module-cached).
    const relief = getRelief();
    let reliefBmp: HTMLCanvasElement | null = null;
    if (relief) {
      reliefBmp = document.createElement("canvas");
      reliefBmp.width = relief.gw;
      reliefBmp.height = relief.gh;
      reliefBmp.getContext("2d")!.putImageData(relief.img, 0, 0);
    }

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(rect.width * dpr);
      const H = Math.round(rect.height * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      // Fit the map (aspect VBW:VBH) inside the box, centred.
      const s = Math.min(W / VBW, H / VBH);
      const ox = (W - VBW * s) / 2;
      const oy = (H - VBH * s) / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, ox, oy);

      // Soft drop shadow lifting the landmass off the glass.
      if (outer) {
        ctx.save();
        ctx.shadowColor = "rgba(32,44,54,0.30)";
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 12;
        ctx.fillStyle = "#9cbd7c";
        ctx.fill(outer);
        ctx.restore();
      }

      // Relief, clipped to the national border.
      ctx.save();
      ctx.clip(outlineAll, "evenodd");
      if (reliefBmp) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(reliefBmp, 0, 0, VBW, VBH);
      } else {
        ctx.fillStyle = "#a7c489";
        ctx.fillRect(0, 0, VBW, VBH);
      }

      // Rivers under the lakes — faint hydrography.
      ctx.strokeStyle = "rgba(120,168,202,0.38)";
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const r of riverPaths) ctx.stroke(r);

      // Lakes.
      ctx.fillStyle = "#7fb2d8";
      for (const l of lakePaths) ctx.fill(l);
      ctx.strokeStyle = "rgba(74,120,155,0.6)";
      ctx.lineWidth = 0.6;
      for (const l of lakePaths) ctx.stroke(l);

      // Canton borders — fine, low-contrast lines (the "detail").
      ctx.strokeStyle = "rgba(70,86,74,0.32)";
      ctx.lineWidth = 0.7;
      ctx.lineJoin = "round";
      for (const c of cantonPaths) ctx.stroke(c);
      ctx.restore();

      // National border — crisp, above everything.
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(52,68,58,0.85)";
      ctx.lineWidth = 1.6;
      if (outer) ctx.stroke(outer);
      ctx.restore();
    };

    draw();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className={`relative ${className}`}
      ref={wrapRef}
      style={{
        aspectRatio: `${VBW} / ${VBH}`,
        margin: "auto",
        maxHeight: "100%",
      }}
    >
      {/* SSR / no-JS base: accurate outline + canton lines + hypsometric tint. */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VBW} ${VBH}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ch-hyps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a3c586" />
            <stop offset="0.55" stopColor="#c3c69a" />
            <stop offset="0.8" stopColor="#c8c6bf" />
            <stop offset="1" stopColor="#e9edf0" />
          </linearGradient>
          <clipPath id="ch-outline">
            {OUTLINE.map((d, i) => (
              <path d={d} key={i} />
            ))}
          </clipPath>
        </defs>
        <path
          clipRule="evenodd"
          d={OUTLINE.join(" ")}
          fill="url(#ch-hyps)"
          fillRule="evenodd"
        />
        <g clipPath="url(#ch-outline)">
          {LAKES.map((d, i) => (
            <path d={d} fill="#7fb2d8" key={`l${i}`} />
          ))}
          {CANTONS.map((d, i) => (
            <path
              d={d}
              fill="none"
              key={`c${i}`}
              stroke="rgba(70,86,74,0.3)"
              strokeWidth="0.7"
            />
          ))}
        </g>
        <path
          d={OUTLINE[0]}
          fill="none"
          stroke="rgba(52,68,58,0.85)"
          strokeWidth="1.6"
        />
      </svg>

      {/* Enhanced shaded-relief canvas (covers the SVG once painted). */}
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
    </div>
  );
}
