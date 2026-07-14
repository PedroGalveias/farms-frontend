"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapPin, ShoppingBasket, Sprout, type LucideIcon } from "lucide-react";
import { buildFarmMapPoints, projectToSwissMap } from "@/lib/farm-map";
import { getNearestFarms } from "@/lib/quick-search";
import { prefersReducedMotion } from "@/lib/motion";
import { useMotionSignal } from "@/components/motion/useMotionSignal";
import { useT } from "@/components/i18n/LanguageProvider";
import type {
  QuickSearchLocation,
  QuickSearchResult,
} from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

type Step = "location" | "products" | "results";

const STEP_INDEX: Record<Step, number> = {
  location: 0,
  products: 1,
  results: 2,
};

const STEP_NODES: { icon: LucideIcon; id: Step; label: string }[] = [
  { icon: MapPin, id: "location", label: "Location" },
  { icon: ShoppingBasket, id: "products", label: "Products" },
  { icon: Sprout, id: "results", label: "Farms" },
];

// How many nearest results get a connection line, and how many get a name.
const CONNECTED_RESULTS = 8;
const LABELLED_RESULTS = 3;

/**
 * The map's drawable region inside the panel: full width with margins, and
 * vertically biased into the upper band so the headline keeps its floor.
 */
const MAP_INSET = { bottom: 0.3, left: 0.08, right: 0.06, top: 0.16 };

interface PanelProps {
  farms: Farm[];
  location: QuickSearchLocation;
  results: QuickSearchResult[];
  selectedProducts: string[];
  step: Step;
}

/**
 * Desktop-only panel, v2: a LIVING map of Switzerland drawn from the actual
 * dataset — every farm is a dot at its real coordinates. Picking products
 * lights up the matching dots in real time; setting a location lands a
 * pulsing ring; reaching results draws threads from you to the nearest
 * matches and names the top ones. The original "visualise your progress"
 * idea, but the progress shown is the search itself, not an abstraction.
 *
 * Rendering: one 2d canvas, redrawn on a slow rAF clock for the ambient
 * shimmer (paused under prefers-reduced-motion → single static draw, and
 * while the tab is hidden). ~3k dots is trivial for canvas; labels are HTML
 * overlays so text stays crisp.
 */
export default function DiscoveryPanel({
  farms,
  location,
  results,
  selectedProducts,
  step,
}: PanelProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionSignal = useMotionSignal();
  const index = STEP_INDEX[step];

  const points = useMemo(() => buildFarmMapPoints(farms), [farms]);

  const matchedIds = useMemo(
    () =>
      selectedProducts.length === 0
        ? null
        : new Set(results.map((result) => result.farm.id)),
    [results, selectedProducts.length],
  );

  const origin = useMemo(
    () =>
      location.coordinates
        ? projectToSwissMap(
            location.coordinates.latitude,
            location.coordinates.longitude,
          )
        : null,
    [location.coordinates],
  );

  // The nearest matched farms, for connection threads + name labels.
  const nearest = useMemo(() => {
    if (!location.coordinates || step !== "results" || results.length === 0) {
      return [];
    }
    return getNearestFarms(
      results.map((result) => result.farm),
      location.coordinates,
      CONNECTED_RESULTS,
    );
  }, [location.coordinates, results, step]);

  const nearestProjected = useMemo(
    () =>
      nearest
        .map(({ farm }) => {
          const point = points.find((p) => p.farmId === farm.id);
          return point ? { farm, x: point.x, y: point.y } : null;
        })
        .filter((value): value is NonNullable<typeof value> => value !== null),
    [nearest, points],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const reduced = prefersReducedMotion();
    let raf = 0;
    let running = true;
    let last = 0;

    // One 32px glow sprite, stamped per matched dot (drawImage is cheap;
    // per-dot shadowBlur is not).
    const SPRITE = 32;
    const sprite = document.createElement("canvas");
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const half = SPRITE / 2;
      const glow = sctx.createRadialGradient(half, half, 0, half, half, half);
      glow.addColorStop(0, "rgba(190, 255, 214, 0.95)");
      glow.addColorStop(0.25, "rgba(134, 239, 172, 0.85)");
      glow.addColorStop(0.6, "rgba(74, 222, 128, 0.28)");
      glow.addColorStop(1, "rgba(74, 222, 128, 0)");
      sctx.fillStyle = glow;
      sctx.fillRect(0, 0, SPRITE, SPRITE);
    }

    const toPx = (nx: number, ny: number, w: number, h: number) => {
      const innerW = w * (1 - MAP_INSET.left - MAP_INSET.right);
      const innerH = h * (1 - MAP_INSET.top - MAP_INSET.bottom);
      return {
        x: w * MAP_INSET.left + nx * innerW,
        y: h * MAP_INSET.top + ny * innerH,
      };
    };

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        return;
      }
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const tSec = now / 1000;
      const hasSelection = matchedIds !== null;

      // Base layer: every farm in the country. When a selection exists the
      // field dims so the matches carry the picture.
      for (const point of points) {
        const { x, y } = toPx(point.x, point.y, w, h);
        const isMatch = hasSelection && matchedIds.has(point.farmId);
        if (isMatch) {
          continue; // matches draw on top, after the field
        }
        ctx.fillStyle = hasSelection
          ? "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.26)";
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hasSelection) {
        // A gentle collective shimmer — dots breathe slightly out of phase
        // (keyed by position so it's stable frame to frame).
        for (const point of points) {
          if (!matchedIds.has(point.farmId)) {
            continue;
          }
          const { x, y } = toPx(point.x, point.y, w, h);
          const phase = reduced
            ? 0.5
            : Math.sin(tSec * 1.6 + point.x * 9 + point.y * 7) * 0.5 + 0.5;
          const size = 9 + phase * 5;
          ctx.globalAlpha = 0.7 + phase * 0.3;
          ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      }

      // Location marker: crosshair ring, pulsing while it's the active step.
      if (origin) {
        const { x, y } = toPx(origin.x, origin.y, w, h);
        const pulse = reduced ? 0 : (tSec % 2.4) / 2.4;
        if (!reduced) {
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - pulse)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 8 + pulse * 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Result threads: you → the nearest matches.
      if (origin && nearestProjected.length > 0) {
        const from = toPx(origin.x, origin.y, w, h);
        for (const target of nearestProjected) {
          const to = toPx(target.x, target.y, w, h);
          const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          gradient.addColorStop(0, "rgba(255,255,255,0.5)");
          gradient.addColorStop(1, "rgba(134,239,172,0.25)");
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          // A slight arc reads friendlier than a straight spoke.
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.08;
          ctx.quadraticCurveTo(midX, midY, to.x, to.y);
          ctx.stroke();
        }
      }
    };

    const loop = (now: number) => {
      if (!running) {
        return;
      }
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / 24) {
        return; // ambience, not action — 24fps is plenty
      }
      last = now;
      draw(now);
    };

    if (reduced) {
      // Single static frame; re-runs whenever the search state changes.
      draw(0);
      const onResize = () => draw(0);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [matchedIds, motionSignal, nearestProjected, origin, points]);

  const labelled = nearestProjected.slice(0, LABELLED_RESULTS);

  return (
    <div
      aria-hidden="true"
      className="relative hidden flex-1 overflow-hidden lg:block"
      style={{
        background:
          "linear-gradient(155deg, #1f8a4e 0%, #16713f 46%, #0c4a2a 100%)",
      }}
    >
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />

      {/* Name labels for the top nearest matches (HTML keeps text crisp). */}
      {labelled.map(({ farm, x, y }) => (
        <div
          className="chip-pop absolute -translate-x-1/2 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm"
          key={farm.id}
          style={{
            left: `${(MAP_INSET.left + x * (1 - MAP_INSET.left - MAP_INSET.right)) * 100}%`,
            top: `calc(${(MAP_INSET.top + y * (1 - MAP_INSET.top - MAP_INSET.bottom)) * 100}% + ${10 + labelled.indexOf(labelled.find((l) => l.farm.id === farm.id)!) * 26}px)`,
          }}
        >
          {farm.name}
        </div>
      ))}

      {/* Step progress, now a quiet legend along the top. */}
      <div className="absolute left-10 top-10 flex items-center gap-2.5">
        {STEP_NODES.map((node, nodeIndex) => {
          const Icon = node.icon;
          const reached = nodeIndex <= index;
          const isCurrent = nodeIndex === index;
          return (
            <div className="relative" key={node.id}>
              {isCurrent ? (
                <span className="pulse-dot absolute -inset-1.5 rounded-full bg-white/20" />
              ) : null}
              <div
                className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-500 ${
                  reached
                    ? "border-transparent bg-white text-pine shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)]"
                    : "border-white/25 bg-white/10 text-white/55"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Headline + live count */}
      <div className="absolute bottom-12 left-12 right-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          Swiss farm map
        </p>
        <h2 className="mt-3 text-[clamp(2.5rem,4.5vw,4rem)] font-black leading-[0.92] tracking-[-0.04em] text-white">
          Nearest <span className="text-white/80">first.</span>
        </h2>
        {selectedProducts.length > 0 ? (
          <p className="mt-3 text-sm font-semibold text-white/75">
            {t("results_farms", { n: results.length })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
