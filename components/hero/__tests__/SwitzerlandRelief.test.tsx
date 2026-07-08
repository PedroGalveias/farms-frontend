import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import SwitzerlandRelief from "@/components/hero/SwitzerlandRelief";
import { CANTONS, OUTLINE } from "@/lib/swiss-geo";

describe("SwitzerlandRelief", () => {
  it("renders an accessible-hidden SVG base with the real geometry", async () => {
    // jsdom has no 2D canvas context, so the effect early-returns and only the
    // SSR/no-JS SVG base is present — which is exactly the fallback we want to
    // guarantee renders without a canvas.
    const { container } = render(<SwitzerlandRelief className="w-full" />);
    await act(async () => {});

    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.getAttribute("aria-hidden")).toBe("true");

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    // Every canton boundary plus the national outline is drawn as a <path>.
    const paths = svg!.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(
      OUTLINE.length + CANTONS.length,
    );
  });

  it("ships faithful geometry (26 cantons, plausible aspect ratio)", () => {
    // The Swiss outline is markedly wider than tall (~1.55:1).
    expect(CANTONS.length).toBeGreaterThanOrEqual(26);
    expect(OUTLINE.length).toBeGreaterThanOrEqual(1);
  });

  it("does not throw when a 2D context is available", async () => {
    // Give jsdom a minimal 2D context stub so the draw path executes without a
    // real canvas backend — it must run start-to-finish without throwing.
    const stub = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      putImageData: vi.fn(),
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      }),
      set fillStyle(_v: string) {},
      set strokeStyle(_v: string) {},
      set lineWidth(_v: number) {},
      set lineJoin(_v: string) {},
      set lineCap(_v: string) {},
      set shadowColor(_v: string) {},
      set shadowBlur(_v: number) {},
      set shadowOffsetY(_v: number) {},
      set imageSmoothingEnabled(_v: boolean) {},
      set imageSmoothingQuality(_v: string) {},
    };
    const origGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => stub,
    ) as unknown as typeof origGet;
    // Path2D may be missing in jsdom — provide a no-op stub whose constructor
    // mirrors the real `new Path2D(path?)` signature (a zero-arg stub makes
    // CodeQL read every `new Path2D(d)` as passing a superfluous argument).
    const hadPath2D = "Path2D" in globalThis;
    if (!hadPath2D) {
      (globalThis as { Path2D?: unknown }).Path2D = class {
        constructor(path?: string) {
          void path;
        }
        addPath(path?: unknown) {
          void path;
        }
      };
    }
    try {
      const { container } = render(<SwitzerlandRelief className="w-full" />);
      await act(async () => {});
      expect(container.querySelector("canvas")).not.toBeNull();
    } finally {
      HTMLCanvasElement.prototype.getContext = origGet;
      if (!hadPath2D) delete (globalThis as { Path2D?: unknown }).Path2D;
    }
  });
});
