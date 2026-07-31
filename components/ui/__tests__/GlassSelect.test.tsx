import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import GlassSelect from "@/components/ui/GlassSelect";

const OPTIONS = [
  { label: "All cantons", value: "all" },
  { label: "Bern", value: "be" },
  { label: "Zürich", value: "zh" },
];

// The component arms its close-on-scroll listener inside requestAnimationFrame,
// so "before the next frame" versus "after it" is the exact distinction these
// tests need to make. jsdom's real rAF fires on its own schedule (~16ms), which
// made a plain `await sleep(n)` a coin flip — an earlier draft of this file had
// tests that passed or failed on timing rather than on behaviour. Driving the
// frame queue by hand makes each case deterministic.
let frameQueue: FrameRequestCallback[] = [];
const realRaf = globalThis.requestAnimationFrame;
const realCancelRaf = globalThis.cancelAnimationFrame;

/** Run everything queued for the next frame. */
function flushFrame() {
  const queued = frameQueue;
  frameQueue = [];
  act(() => {
    for (const cb of queued) cb(0);
  });
}

beforeAll(() => {
  // jsdom implements neither; the component calls scrollIntoView on open.
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    frameQueue.push(cb)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => {
    frameQueue[id - 1] = () => {};
  }) as unknown as typeof cancelAnimationFrame;
});

afterAll(() => {
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCancelRaf;
});

afterEach(() => {
  cleanup();
  frameQueue = [];
});

function open() {
  const onChange = vi.fn();
  render(
    <GlassSelect
      ariaLabel="Canton"
      onChange={onChange}
      options={OPTIONS}
      value="all"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Canton" }));
  return onChange;
}

describe("GlassSelect", () => {
  it("opens a listbox with every option", () => {
    open();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  // Opening the list can itself produce a scroll: activating the trigger
  // scrolls it into view, and on touch the momentum from reaching the toolbar
  // is often still decaying when the finger lifts. That scroll lands in the
  // same frame the close-on-scroll listener attaches, so without the arming
  // delay the list shuts the instant it opens — intermittently in CI, and
  // reproducibly on a phone.
  it("survives a scroll that arrives before the first frame", () => {
    open();
    // Deliberately no flushFrame() — this is the opening frame.
    fireEvent.scroll(document, {});
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes on a genuine page scroll once armed", () => {
    open();
    flushFrame();
    fireEvent.scroll(document, {});
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // Scrolling the options is not the page moving underneath them: the trigger's
  // rect is unchanged, so the popover is still correctly placed.
  it("does not close when the scroll came from inside the list", () => {
    open();
    flushFrame();
    fireEvent.scroll(screen.getByRole("listbox"), {});
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes on an outside pointerdown but not on one inside the list", () => {
    open();
    flushFrame();
    fireEvent.pointerDown(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("commits a chosen option and closes", () => {
    const onChange = open();
    flushFrame();
    fireEvent.click(screen.getByRole("option", { name: "Bern" }));
    expect(onChange).toHaveBeenCalledWith("be");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape without committing", () => {
    const onChange = open();
    flushFrame();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  // Keeping the active option in view is pure geometry, so it is tested here
  // against a stubbed layout rather than in Playwright. An e2e version of this
  // measured real rects on a shared dev server and failed about half the time
  // under parallel load — the assertion was sound but the environment wasn't.
  // jsdom has no layout at all, which is an advantage here: the boxes are
  // whatever we say they are, so the arithmetic is checked exactly.
  describe("keeping the active option in view", () => {
    const MANY = Array.from({ length: 10 }, (_, i) => ({
      label: `Option ${i}`,
      value: `v${i}`,
    }));
    const OPTION_H = 40;
    const VIEW_H = 100; // 2.5 options visible

    /** Give the list a fake layout: 10 rows of 40px inside a 100px window. */
    function stubLayout(list: HTMLElement) {
      const rect = (top: number, height: number) =>
        ({
          top,
          bottom: top + height,
          height,
          left: 0,
          right: 0,
          width: 0,
          x: 0,
          y: top,
          toJSON() {},
        }) as DOMRect;

      Object.defineProperty(list, "clientHeight", {
        configurable: true,
        value: VIEW_H,
      });
      list.getBoundingClientRect = () => rect(0, VIEW_H);

      for (const [index, option] of Array.from(
        list.querySelectorAll<HTMLElement>('[role="option"]'),
      ).entries()) {
        // Rows sit at index*40 in content space; on screen they shift up by
        // however far the list is scrolled.
        option.getBoundingClientRect = () =>
          rect(index * OPTION_H - list.scrollTop, OPTION_H);
      }
    }

    function openMany() {
      render(
        <GlassSelect
          ariaLabel="Canton"
          onChange={vi.fn()}
          options={MANY}
          value="v0"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Canton" }));
      const list = screen.getByRole("listbox");
      stubLayout(list);
      return list;
    }

    it("scrolls down just enough to reveal an option below the fold", () => {
      const list = openMany();
      expect(list.scrollTop).toBe(0);

      // Option 2 spans 80..120 — 20px past the 100px window.
      fireEvent.keyDown(list, { key: "ArrowDown" });
      fireEvent.keyDown(list, { key: "ArrowDown" });
      expect(list.scrollTop).toBe(20);
    });

    it("follows the active option to the end of a long list", () => {
      const list = openMany();
      fireEvent.keyDown(list, { key: "End" });
      // Last option spans 360..400; showing its bottom needs 400 - 100.
      expect(list.scrollTop).toBe(300);
    });

    it("scrolls back up when arrowing above the visible window", () => {
      const list = openMany();
      fireEvent.keyDown(list, { key: "End" });
      expect(list.scrollTop).toBe(300);

      fireEvent.keyDown(list, { key: "Home" });
      // Option 0 starts at 0, so the list must return to the top.
      expect(list.scrollTop).toBe(0);
    });

    it("leaves the scroll alone while the active option is already visible", () => {
      const list = openMany();
      // Option 1 spans 40..80, fully inside the 0..100 window.
      fireEvent.keyDown(list, { key: "ArrowDown" });
      expect(list.scrollTop).toBe(0);
    });
  });
});
