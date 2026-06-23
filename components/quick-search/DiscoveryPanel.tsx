"use client";

import { MapPin, ShoppingBasket, Sprout, type LucideIcon } from "lucide-react";
import { categoryEmoji } from "@/lib/categories";
import { tagLabel } from "@/lib/products";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Step = "location" | "products" | "results";

const STEP_INDEX: Record<Step, number> = {
  location: 0,
  products: 1,
  results: 2,
};

const NODES: { icon: LucideIcon; label: string; x: number; y: number }[] = [
  { icon: MapPin, label: "Location", x: 16, y: 72 },
  { icon: ShoppingBasket, label: "Products", x: 46, y: 50 },
  { icon: Sprout, label: "Farms", x: 76, y: 29 },
];

// Dots tracing each leg of the route, revealed in sequence as you advance.
const LEG_A = [
  { x: 19, y: 71 },
  { x: 24, y: 67 },
  { x: 29, y: 63.5 },
  { x: 34, y: 60 },
  { x: 39, y: 56 },
  { x: 43, y: 52.5 },
];
const LEG_B = [
  { x: 50, y: 47 },
  { x: 55, y: 44 },
  { x: 60, y: 40.5 },
  { x: 65, y: 37 },
  { x: 70, y: 33.5 },
  { x: 74, y: 30.5 },
];

// A selected product's slot — a staggered grid in the panel's open upper band,
// generated per index so any number of selections lay out without overlapping.
function chipSlot(i: number) {
  const perRow = 4;
  const col = i % perRow;
  const row = Math.floor(i / perRow);
  const stagger = row % 2 === 0 ? 0 : 9;
  const jitterY = (i % 3) - 1;
  return {
    x: 13 + col * 19 + stagger,
    y: 12 + row * 12 + jitterY,
  };
}

function Dots({
  dots,
  active,
}: {
  dots: { x: number; y: number }[];
  active: boolean;
}) {
  return (
    <>
      {dots.map((dot, index) => (
        <span
          aria-hidden="true"
          className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 transition-all duration-500 ease-out ${
            active ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
          key={`${dot.x}-${dot.y}`}
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            transitionDelay: active ? `${index * 70}ms` : "0ms",
          }}
        />
      ))}
    </>
  );
}

/**
 * Desktop-only cinematic field for the quick-search shell, now wired to the
 * flow: three step nodes (location → products → farms) on a green "Swiss farm
 * map", with a dotted route that draws toward the next node as the user
 * advances, product chips that surface once products are in play, and farm
 * markers that land on the results step. Decorative — the leaf card carries
 * the real state.
 */
export default function DiscoveryPanel({
  step,
  selectedProducts,
}: {
  step: Step;
  selectedProducts: string[];
}) {
  const { locale } = useLanguage();
  const index = STEP_INDEX[step];
  const legAActive = index >= 1;
  const legBActive = index >= 2;

  return (
    <div
      aria-hidden="true"
      className="relative hidden flex-1 overflow-hidden lg:block"
      style={{
        background:
          "linear-gradient(155deg, #1f8a4e 0%, #16713f 46%, #0c4a2a 100%)",
      }}
    >
      {/* Topographic contours radiating from the destination */}
      <svg
        className="absolute inset-0 h-full w-full text-white/[0.12]"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 600"
      >
        {Array.from({ length: 10 }).map((_, ring) => (
          <circle
            cx="330"
            cy="90"
            key={ring}
            r={36 + ring * 44}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Route legs */}
      <Dots active={legAActive} dots={LEG_A} />
      <Dots active={legBActive} dots={LEG_B} />

      {/* Selected products pop onto the map; removing one takes it away */}
      {selectedProducts.map((product, slotIndex) => {
        const slot = chipSlot(slotIndex);
        return (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            key={product}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <span className="chip-pop flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              <span aria-hidden="true">{categoryEmoji(product)}</span>
              {tagLabel(product, locale)}
            </span>
          </div>
        );
      })}

      {/* Step nodes */}
      {NODES.map((node, nodeIndex) => {
        const Icon = node.icon;
        const reached = nodeIndex <= index;
        const isCurrent = nodeIndex === index;

        return (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            key={node.label}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {isCurrent ? (
              <span className="pulse-dot absolute -inset-2.5 rounded-full bg-white/25" />
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

      {/* Cropped headline */}
      <div className="absolute bottom-12 left-12 right-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          Swiss farm map
        </p>
        <h2 className="mt-3 text-[clamp(2.5rem,4.5vw,4rem)] font-black leading-[0.92] tracking-[-0.04em] text-white">
          Nearest <span className="text-white/80">first.</span>
        </h2>
      </div>
    </div>
  );
}
