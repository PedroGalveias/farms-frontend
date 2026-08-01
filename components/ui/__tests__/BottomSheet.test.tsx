import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BottomSheet from "@/components/ui/BottomSheet";

const realMatchMedia = window.matchMedia;
function setMobile(isMobile: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: isMobile && /max-width/.test(query),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// A controllable clock so drag velocity (px/ms) is deterministic: fireEvent is
// synchronous, so without this every drag would read as an instantaneous flick.
let now = 0;
const setNow = (value: number) => {
  now = value;
};

// jsdom lacks pointer capture.
beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
  document.body.style.overflow = "";
  document.body.classList.remove("sheet-open");
  now = 0;
});

function renderSheet(onClose = vi.fn()) {
  render(
    <BottomSheet closeLabel="Close" labelledBy="t" onClose={onClose}>
      <h2 id="t">Sheet title</h2>
      <p>Body content</p>
    </BottomSheet>,
  );
  return onClose;
}

describe("BottomSheet", () => {
  it("renders children inside a labelled dialog and locks body scroll", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "t");
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.classList.contains("sheet-open")).toBe(true);
  });

  it("closes on backdrop click and on Escape", () => {
    const onClose = renderSheet();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores body scroll and removes sheet-open on unmount", () => {
    const { unmount } = render(
      <BottomSheet closeLabel="Close" onClose={vi.fn()}>
        <p>Body</p>
      </BottomSheet>,
    );
    expect(document.body.classList.contains("sheet-open")).toBe(true);
    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(document.body.classList.contains("sheet-open")).toBe(false);
  });

  it("dismisses when the grabber is flicked down past the threshold (mobile)", () => {
    setMobile(true);
    const onClose = renderSheet();
    const grabber = document.querySelector("[data-grabber]") as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 100 + 130, pointerId: 1 }); // > 110
    fireEvent.pointerUp(grabber, { clientY: 230, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("snaps back when a slow drag stays below the threshold", () => {
    setMobile(true);
    const onClose = renderSheet();
    const sheet = screen.getByRole("dialog") as HTMLElement;
    const grabber = document.querySelector("[data-grabber]") as HTMLElement;
    setNow(0);
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    setNow(300); // 40px over 300ms ≈ 0.13 px/ms — a slow drag, not a flick
    fireEvent.pointerMove(grabber, { clientY: 100 + 40, pointerId: 1 }); // < 110
    fireEvent.pointerUp(grabber, { clientY: 140, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
    // Snapped back to rest.
    expect(sheet.style.transform).toBe("");
  });

  it("dismisses on a fast downward flick even below the distance threshold", () => {
    setMobile(true);
    const onClose = renderSheet();
    const grabber = document.querySelector("[data-grabber]") as HTMLElement;
    setNow(0);
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    setNow(20); // 40px over 20ms = 2 px/ms — a fast flick, well past FLICK_VELOCITY
    fireEvent.pointerMove(grabber, { clientY: 100 + 40, pointerId: 1 }); // < 110
    fireEvent.pointerUp(grabber, { clientY: 140, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores the drag gesture on desktop (centred modal)", () => {
    setMobile(false);
    const onClose = renderSheet();
    const grabber = document.querySelector("[data-grabber]") as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 400, pointerId: 1 });
    fireEvent.pointerUp(grabber, { clientY: 400, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismisses on a left-edge swipe right past the threshold (mobile back gesture)", () => {
    setMobile(true);
    const onClose = renderSheet();
    const edgeZone = document.querySelector("[data-edge-swipe]") as HTMLElement;
    setNow(0);
    fireEvent.pointerDown(edgeZone, { clientX: 4, pointerId: 1 });
    setNow(300); // slow drag so only distance (not velocity) triggers it
    fireEvent.pointerMove(edgeZone, { clientX: 4 + 100, pointerId: 1 }); // > 90
    fireEvent.pointerUp(edgeZone, { clientX: 104, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("snaps back when a short edge drag stays below the threshold", () => {
    setMobile(true);
    const onClose = renderSheet();
    const sheet = screen.getByRole("dialog") as HTMLElement;
    const edgeZone = document.querySelector("[data-edge-swipe]") as HTMLElement;
    setNow(0);
    fireEvent.pointerDown(edgeZone, { clientX: 4, pointerId: 1 });
    setNow(300); // 40px over 300ms ≈ 0.13 px/ms — slow, not a flick
    fireEvent.pointerMove(edgeZone, { clientX: 4 + 40, pointerId: 1 }); // < 90
    fireEvent.pointerUp(edgeZone, { clientX: 44, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
    expect(sheet.style.transform).toBe("");
  });

  it("dismisses on a fast rightward edge flick even below the distance threshold", () => {
    setMobile(true);
    const onClose = renderSheet();
    const edgeZone = document.querySelector("[data-edge-swipe]") as HTMLElement;
    setNow(0);
    fireEvent.pointerDown(edgeZone, { clientX: 4, pointerId: 1 });
    setNow(20); // 40px over 20ms = 2 px/ms — well past FLICK_VELOCITY
    fireEvent.pointerMove(edgeZone, { clientX: 4 + 40, pointerId: 1 }); // < 90
    fireEvent.pointerUp(edgeZone, { clientX: 44, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Scroll-then-drag handoff (§5) ──────────────────────────────────────
  // Dragging the sheet's content may only dismiss from the top of its own
  // scroller; below the top the gesture belongs to the scroller.
  function renderScrollableSheet(scrollTop: number) {
    const onClose = vi.fn();
    render(
      <BottomSheet closeLabel="Close" onClose={onClose}>
        <div data-testid="scroller" style={{ overflowY: "auto" }}>
          <p>Long body</p>
        </div>
      </BottomSheet>,
    );
    const scroller = screen.getByTestId("scroller");
    // jsdom reports 0 for both, so a scroller is never "scrollable" by default.
    Object.defineProperty(scroller, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(scroller, "clientHeight", {
      value: 300,
      configurable: true,
    });
    scroller.scrollTop = scrollTop;
    return { onClose, scroller };
  }

  it("content drag dismisses when its scroller is at the top", () => {
    setMobile(true);
    const { onClose, scroller } = renderScrollableSheet(0);
    fireEvent.pointerDown(scroller, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(scroller, { clientY: 240, pointerId: 1 }); // > 110
    fireEvent.pointerUp(scroller, { clientY: 240, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("content drag does NOT dismiss while the scroller is scrolled down", () => {
    setMobile(true);
    const { onClose, scroller } = renderScrollableSheet(120);
    fireEvent.pointerDown(scroller, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(scroller, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(scroller, { clientY: 240, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the grabber still dismisses even when content is scrolled down", () => {
    setMobile(true);
    const { onClose } = renderScrollableSheet(120);
    const grabber = document.querySelector("[data-grabber]") as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(grabber, { clientY: 240, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The trap stops focus LEAVING; it does not bring focus in. Without an
  // explicit move, the sheet opens with focus still on the trigger behind it.
  describe("focus management", () => {
    it("moves focus into the sheet on open", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      expect(trigger).toHaveFocus();

      renderSheet();
      // The move happens on the first painted frame so WebKit accepts it.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveFocus();
      trigger.remove();
    });

    it("returns focus to the trigger on close", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();

      const { unmount } = render(
        <BottomSheet closeLabel="Close" onClose={vi.fn()}>
          <p>Body</p>
        </BottomSheet>,
      );
      await Promise.resolve();
      unmount();

      expect(trigger).toHaveFocus();
      trigger.remove();
    });

    // Every consumer passes an inline arrow (`onClose={() => setOpen(false)}`),
    // so `onClose` is a new function on each parent render. If the focus
    // lifecycle keys on its identity, a routine parent re-render tears the
    // effect down and back up: focus is yanked out of the sheet to the trigger,
    // the body scroll-lock is released and re-applied, and the remembered
    // restore target is overwritten. The user loses their place mid-sheet.
    it("keeps focus inside the sheet when the parent re-renders with a new onClose", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();

      // A fresh arrow on every render, exactly as the real consumers do.
      const Parent = ({ tick }: { tick: number }) => (
        <BottomSheet closeLabel="Close" onClose={() => void tick}>
          <button type="button">Inside</button>
        </BottomSheet>
      );

      const { rerender } = render(<Parent tick={0} />);
      await Promise.resolve();
      await Promise.resolve();

      const inside = screen.getByRole("button", { name: "Inside" });
      inside.focus();
      expect(inside).toHaveFocus();

      rerender(<Parent tick={1} />);
      await Promise.resolve();
      await Promise.resolve();

      // Focus must not have been dragged out of the sheet, and the scroll lock
      // must not have flickered off.
      expect(inside).toHaveFocus();
      expect(document.body.style.overflow).toBe("hidden");
      expect(document.body.classList.contains("sheet-open")).toBe(true);
      trigger.remove();
    });

    it("still restores focus to the original trigger after a re-render", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();

      const Parent = ({ tick }: { tick: number }) => (
        <BottomSheet closeLabel="Close" onClose={() => void tick}>
          <p>Body</p>
        </BottomSheet>
      );

      const { rerender, unmount } = render(<Parent tick={0} />);
      await Promise.resolve();
      rerender(<Parent tick={1} />);
      await Promise.resolve();
      unmount();

      // The trigger captured at mount is the one focus goes back to — a
      // re-render must not have re-captured the sheet itself as the target.
      expect(trigger).toHaveFocus();
      trigger.remove();
    });

    it("Escape calls the LATEST onClose, not the one captured at mount", () => {
      const first = vi.fn();
      const second = vi.fn();
      const Parent = ({ cb }: { cb: () => void }) => (
        <BottomSheet closeLabel="Close" onClose={cb}>
          <p>Body</p>
        </BottomSheet>
      );

      const { rerender } = render(<Parent cb={first} />);
      rerender(<Parent cb={second} />);
      fireEvent.keyDown(document, { key: "Escape" });

      // Decoupling the effect from `onClose` must not staleness-trap the
      // handler: the sheet has to close through the current callback.
      expect(second).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
    });
  });

  it("ignores the edge-swipe on desktop (centred modal)", () => {
    setMobile(false);
    const onClose = renderSheet();
    const edgeZone = document.querySelector("[data-edge-swipe]") as HTMLElement;
    fireEvent.pointerDown(edgeZone, { clientX: 4, pointerId: 1 });
    fireEvent.pointerMove(edgeZone, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(edgeZone, { clientX: 300, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
  });
});
