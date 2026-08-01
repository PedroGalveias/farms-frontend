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

afterEach(() => {
  window.devicePixelRatio = 1;
  cleanup();
});

/** The pixel centre of a farm's dot, mirroring the component's fit() maths. */
function dotPixel(lat: number, lng: number, width = W, height = H) {
  const p = projectToSwissMap(lat, lng)!;
  const availW = width * (1 - PAD * 2);
  const availH = height * (1 - PAD * 2);
  let mapW = availW;
  let mapH = mapW / CH_MAP_ASPECT;
  if (mapH > availH) {
    mapH = availH;
    mapW = mapH * CH_MAP_ASPECT;
  }
  const offX = (width - mapW) / 2;
  const offY = (height - mapH) / 2;
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

  it("drops the mini-card when the hovered farm leaves the filtered set", () => {
    // Filters can change while the pointer rests on a dot — the card must not
    // keep showing a farm that is no longer a result.
    const { rerender } = render(
      <LanguageProvider>
        <FarmDotMap
          allFarms={[BERGHOF, ZURIHOF]}
          distanceByFarmId={new Map()}
          onOpenFarm={vi.fn<OpenFarm>()}
          visibleFarms={[BERGHOF]}
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

    const dot = dotPixel(46.95, 7.45);
    fireEvent.pointerMove(canvas, { clientX: dot.x, clientY: dot.y });
    expect(screen.getByText("Berghof Studer")).toBeInTheDocument();

    // A filter change removes it from the results.
    rerender(
      <LanguageProvider>
        <FarmDotMap
          allFarms={[BERGHOF, ZURIHOF]}
          distanceByFarmId={new Map()}
          onOpenFarm={vi.fn<OpenFarm>()}
          visibleFarms={[ZURIHOF]}
        />
      </LanguageProvider>,
    );
    expect(screen.queryByText("Berghof Studer")).not.toBeInTheDocument();
  });

  it("only the filtered farms are clickable (the dim field is not)", () => {
    const onOpenFarm = vi.fn<OpenFarm>();
    // Zürihof is in the field but NOT in visibleFarms → its dot is inert.
    const { canvas } = renderMap({ onOpenFarm, visibleFarms: [BERGHOF] });
    const zuri = dotPixel(47.4, 8.5);
    fireEvent.click(canvas, { clientX: zuri.x, clientY: zuri.y });
    expect(onOpenFarm).not.toHaveBeenCalled();
  });

  it("uses stable integer backing dimensions at a fractional Windows DPR", () => {
    const width = 601;
    const height = 401;
    window.devicePixelRatio = 1.25;
    const { canvas } = renderMap();
    Object.defineProperties(canvas, {
      clientHeight: { configurable: true, value: height },
      clientWidth: { configurable: true, value: width },
    });
    canvas.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width,
        height,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
      }) as DOMRect;

    const widthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "width",
    );
    const heightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "height",
    );
    if (
      !widthDescriptor?.get ||
      !widthDescriptor.set ||
      !heightDescriptor?.get ||
      !heightDescriptor.set
    ) {
      throw new Error("Canvas dimension descriptors are unavailable");
    }
    let widthAssignments = 0;
    let heightAssignments = 0;
    Object.defineProperties(canvas, {
      height: {
        configurable: true,
        get: () => heightDescriptor.get?.call(canvas),
        set: (value) => {
          heightAssignments += 1;
          heightDescriptor.set?.call(canvas, value);
        },
      },
      width: {
        configurable: true,
        get: () => widthDescriptor.get?.call(canvas),
        set: (value) => {
          widthAssignments += 1;
          widthDescriptor.set?.call(canvas, value);
        },
      },
    });

    const dot = dotPixel(46.95, 7.45, width, height);

    fireEvent.pointerMove(canvas, { clientX: dot.x, clientY: dot.y });
    expect(canvas.width).toBe(751);
    expect(canvas.height).toBe(501);
    expect(widthAssignments).toBe(1);
    expect(heightAssignments).toBe(1);

    fireEvent.pointerLeave(canvas);
    fireEvent.pointerMove(canvas, { clientX: dot.x, clientY: dot.y });
    expect(canvas.width).toBe(751);
    expect(canvas.height).toBe(501);
    expect(widthAssignments).toBe(1);
    expect(heightAssignments).toBe(1);
  });
});
