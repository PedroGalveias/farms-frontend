import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import FarmDotMap from "@/components/FarmDotMap";
import { CH_MAP_ASPECT, projectToSwissMap } from "@/lib/farm-map";
import type { Farm } from "@/types/farm";

// jsdom has no canvas or layout engine: stub a 2d context so draw() runs, and
// pin the canvas box so the projection maths resolve to real pixels.
const PAD = 0.06; // mirrors the component constant
const W = 600;
const H = 400;

function ctxStub() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
  };
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() =>
    ctxStub(),
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  window.devicePixelRatio = 1;
  // ResizeObserver isn't in jsdom.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => cleanup());

/** The pixel centre of a farm's dot, mirroring the component's fit() maths. */
function dotPixel(lat: number, lng: number) {
  const p = projectToSwissMap(lat, lng)!;
  const availW = W * (1 - PAD * 2);
  const availH = H * (1 - PAD * 2);
  let mapW = availW;
  let mapH = mapW / CH_MAP_ASPECT;
  if (mapH > availH) {
    mapH = availH;
    mapW = mapH * CH_MAP_ASPECT;
  }
  const offX = (W - mapW) / 2;
  const offY = (H - mapH) / 2;
  return { x: offX + p.x * mapW, y: offY + p.y * mapH };
}

const BERGHOF: Farm = {
  id: "a",
  name: "Berghof Studer",
  address: "Dorf 1",
  canton: "BE",
  coordinates: "46.95,7.45",
  categories: ["Gemüse"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};
const ZURIHOF: Farm = {
  ...BERGHOF,
  id: "b",
  name: "Zürihof",
  canton: "ZH",
  coordinates: "47.4,8.5",
};

type OpenFarm = (farm: Farm, sourceEl?: HTMLElement | null) => void;

function renderMap(
  overrides: {
    onOpenFarm?: ReturnType<typeof vi.fn<OpenFarm>>;
    visibleFarms?: Farm[];
  } = {},
) {
  const onOpenFarm = overrides.onOpenFarm ?? vi.fn<OpenFarm>();
  render(
    <LanguageProvider>
      <FarmDotMap
        allFarms={[BERGHOF, ZURIHOF]}
        distanceByFarmId={new Map([["a", 4.2]])}
        onOpenFarm={onOpenFarm}
        visibleFarms={overrides.visibleFarms ?? [BERGHOF]}
      />
    </LanguageProvider>,
  );
  const canvas = screen.getByRole("img") as HTMLCanvasElement;
  Object.defineProperty(canvas, "clientWidth", {
    value: W,
    configurable: true,
  });
  Object.defineProperty(canvas, "clientHeight", {
    value: H,
    configurable: true,
  });
  canvas.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: W,
      height: H,
      right: W,
      bottom: H,
      x: 0,
      y: 0,
    }) as DOMRect;
  return { canvas, onOpenFarm };
}

describe("FarmDotMap", () => {
  it("labels the canvas with the visible farm count", () => {
    renderMap();
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Map of 1 farms across Switzerland",
    );
  });

  it("shows a mini-card when hovering a lit dot and clears it on leave", () => {
    const { canvas } = renderMap();
    const dot = dotPixel(46.95, 7.45);
    fireEvent.pointerMove(canvas, { clientX: dot.x, clientY: dot.y });
    expect(screen.getByText("Berghof Studer")).toBeInTheDocument();
    // Canton + distance in the mini-card.
    expect(screen.getByText(/Bern · 4\.2 km/)).toBeInTheDocument();
    fireEvent.pointerLeave(canvas);
    expect(screen.queryByText("Berghof Studer")).not.toBeInTheDocument();
  });

  it("opens the farm when a lit dot is clicked", () => {
    const onOpenFarm = vi.fn<OpenFarm>();
    const { canvas } = renderMap({ onOpenFarm });
    const dot = dotPixel(46.95, 7.45);
    fireEvent.click(canvas, { clientX: dot.x, clientY: dot.y });
    expect(onOpenFarm).toHaveBeenCalledWith(BERGHOF, canvas);
  });

  it("ignores clicks in empty space (no dot within range)", () => {
    const onOpenFarm = vi.fn<OpenFarm>();
    const { canvas } = renderMap({ onOpenFarm });
    fireEvent.click(canvas, { clientX: 1, clientY: 1 });
    expect(onOpenFarm).not.toHaveBeenCalled();
  });

  it("only the filtered farms are clickable (the dim field is not)", () => {
    const onOpenFarm = vi.fn<OpenFarm>();
    // Zürihof is in the field but NOT in visibleFarms → its dot is inert.
    const { canvas } = renderMap({ onOpenFarm, visibleFarms: [BERGHOF] });
    const zuri = dotPixel(47.4, 8.5);
    fireEvent.click(canvas, { clientX: zuri.x, clientY: zuri.y });
    expect(onOpenFarm).not.toHaveBeenCalled();
  });
});
