"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFarmMapPoints, CH_MAP_ASPECT } from "@/lib/farm-map";
import { formatDistanceShort } from "@/lib/directory";
import { getCantonName } from "@/lib/farms";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Farm } from "@/types/farm";

interface FarmDotMapProps {
  /** The full dataset — drawn as the dim field so Switzerland's silhouette holds. */
  allFarms: Farm[];
  /** The currently-filtered farms — lit up, and the only ones that are clickable. */
  visibleFarms: Farm[];
  distanceByFarmId: Map<string, number | null>;
  onOpenFarm: (farm: Farm, sourceEl?: HTMLElement | null) => void;
}

// Margin around the fitted country inside the panel, as a fraction of the box.
const PAD = 0.06;
// How close (px) the pointer must be to a lit dot to grab it.
const HIT_RADIUS = 16;
// Mini-card width cap, and the headroom it needs above a dot before it flips
// to sitting below instead.
const CARD_MAX_W = 240;
const CARD_CLEARANCE = 76;

/** A hovered dot: the farm plus where its mini-card should sit. */
interface HoverTarget {
  farm: Farm;
  /** Card anchor x, clamped so the card can't overflow the panel. */
  left: number;
  /** The dot's y. */
  top: number;
  /** True when there's no headroom above, so the card sits below the dot. */
  below: boolean;
}

/**
 * The directory's map view: the same Swiss dot-map renderer the quick-search
 * discovery panel uses (shared `lib/farm-map.ts` projection), made interactive.
 * Every farm is a dot at its real coordinates; the active filters light their
 * matches while the rest of the country stays a dim field. Hovering a lit dot
 * shows a mini-card; clicking it opens the detail sheet — the same handler the
 * grid/list cards use.
 *
 * One 2d canvas (no WebGL context — the §8 budget is untouched), redrawn only
 * on data / size / hover change (no animation loop), so it's cheap and its
 * output is deterministic. Keyboard and screen-reader users get the fully
 * accessible grid/list views one toggle away; the canvas is labelled `img`.
 */
export default function FarmDotMap({
  allFarms,
  visibleFarms,
  distanceByFarmId,
  onOpenFarm,
}: FarmDotMapProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverTarget | null>(null);

  const fieldPoints = useMemo(() => buildFarmMapPoints(allFarms), [allFarms]);
  const visiblePoints = useMemo(
    () => buildFarmMapPoints(visibleFarms),
    [visibleFarms],
  );
  const visibleById = useMemo(
    () => new Map(visibleFarms.map((farm) => [farm.id, farm])),
    [visibleFarms],
  );

  // Filters can change while the pointer rests on a dot, so a farm that just
  // dropped out of the results must not keep its mini-card (and highlight ring)
  // on screen. Derive the live hover rather than holding stale state — the next
  // pointer move replaces it anyway.
  const activeHover = hover && visibleById.has(hover.farm.id) ? hover : null;

  // Fit the country's aspect ratio inside the container (letterboxed, centred).
  const fit = useCallback((w: number, h: number) => {
    const availW = w * (1 - PAD * 2);
    const availH = h * (1 - PAD * 2);
    let mapW = availW;
    let mapH = mapW / CH_MAP_ASPECT;
    if (mapH > availH) {
      mapH = availH;
      mapW = mapH * CH_MAP_ASPECT;
    }
    return { offX: (w - mapW) / 2, offY: (h - mapH) / 2, mapW, mapH };
  }, []);

  const draw = useCallback(
    (hovered: string | null) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Canvas backing dimensions are integers. Comparing them to a fractional
      // Windows DPR (1.25/1.5) made every hover redraw reset the canvas,
      // creating needless bitmap reallocations while moving across the map.
      const pixelWidth = Math.round(w * dpr);
      const pixelHeight = Math.round(h * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(pixelWidth / w, 0, 0, pixelHeight / h, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { offX, offY, mapW, mapH } = fit(w, h);
      const px = (nx: number) => offX + nx * mapW;
      const py = (ny: number) => offY + ny * mapH;

      // Dim field: the whole country.
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      for (const point of fieldPoints) {
        ctx.beginPath();
        ctx.arc(px(point.x), py(point.y), 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lit matches: soft green halo + bright core.
      for (const point of visiblePoints) {
        const cx = px(point.x);
        const cy = py(point.y);
        ctx.fillStyle = "rgba(74,222,128,0.34)";
        ctx.beginPath();
        ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(200,255,220,0.95)";
        ctx.beginPath();
        ctx.arc(cx, cy, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hovered dot: a white ring to confirm the hit.
      if (hovered) {
        const point = visiblePoints.find((p) => p.farmId === hovered);
        if (point) {
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px(point.x), py(point.y), 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [fieldPoints, visiblePoints, fit],
  );

  // Redraw on data change and on resize (ResizeObserver covers layout shifts
  // the window 'resize' event misses — e.g. the side rail collapsing).
  useEffect(() => {
    draw(activeHover?.farm.id ?? null);
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw(activeHover?.farm.id ?? null));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw, activeHover]);

  // Nearest lit dot to a client point, within HIT_RADIUS — or null.
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const { offX, offY, mapW, mapH } = fit(w, h);
      let best: HoverTarget | null = null;
      let bestDist = HIT_RADIUS * HIT_RADIUS;
      for (const point of visiblePoints) {
        const dotX = offX + point.x * mapW;
        const dotY = offY + point.y * mapH;
        const dx = dotX - mx;
        const dy = dotY - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          const farm = visibleById.get(point.farmId);
          if (farm) {
            bestDist = d2;
            // Keep the mini-card inside the panel: clamp its anchor so a dot
            // near the left/right edge doesn't push the (centred) card out of
            // frame, and flip it below the dot when there's no room above.
            const half = Math.min(CARD_MAX_W, w * 0.8) / 2;
            best = {
              farm,
              left: Math.min(
                Math.max(dotX, half + 8),
                Math.max(w - half - 8, half + 8),
              ),
              top: dotY,
              below: dotY < CARD_CLEARANCE,
            };
          }
        }
      }
      return best;
    },
    [visiblePoints, visibleById, fit],
  );

  const handlePointerMove = (event: React.PointerEvent) => {
    const hit = hitTest(event.clientX, event.clientY);
    setHover((current) => {
      if (hit?.farm.id === current?.farm.id) return current;
      return hit;
    });
  };

  const handleClick = (event: React.MouseEvent) => {
    const hit = hitTest(event.clientX, event.clientY);
    if (hit) onOpenFarm(hit.farm, canvasRef.current);
  };

  // Mini-card secondary line as one string (canton, and distance when located)
  // so it reads as a single node.
  const hoverKm = activeHover
    ? distanceByFarmId.get(activeHover.farm.id)
    : undefined;
  const hoverMeta = activeHover
    ? getCantonName(activeHover.farm.canton) +
      (typeof hoverKm === "number" ? ` · ${formatDistanceShort(hoverKm)}` : "")
    : "";

  return (
    <div
      className="relative overflow-hidden rounded-panel"
      ref={wrapRef}
      style={{
        height: "min(70vh, 640px)",
        background:
          "linear-gradient(155deg, #1f8a4e 0%, #16713f 46%, #0c4a2a 100%)",
      }}
    >
      <canvas
        aria-label={t("map_ariaLabel", { n: visibleFarms.length })}
        className={`absolute inset-0 h-full w-full ${
          activeHover ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={handleClick}
        onPointerLeave={() => setHover(null)}
        onPointerMove={handlePointerMove}
        ref={canvasRef}
        role="img"
      />

      {/* Mini-card for the hovered farm (HTML overlay keeps text crisp). Its
          anchor is clamped and it flips below the dot near the top edge, so it
          never gets clipped by the panel. */}
      {activeHover ? (
        <div
          className={`pointer-events-none absolute z-10 -translate-x-1/2 rounded-field border border-white/25 bg-black/55 px-3 py-2 text-white shadow-elev-2 backdrop-blur-sm ${
            activeHover.below ? "" : "-translate-y-full"
          }`}
          style={{
            left: activeHover.left,
            top: activeHover.below
              ? activeHover.top + 16
              : activeHover.top - 12,
            maxWidth: CARD_MAX_W,
          }}
        >
          <p className="truncate text-sm font-bold leading-tight">
            {activeHover.farm.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/70">{hoverMeta}</p>
        </div>
      ) : null}

      {/* Keyboard / screen-reader users browse via the grid or list view — the
          canvas is a visual affordance. */}
      <p className="sr-only">{t("map_listHint")}</p>
    </div>
  );
}
