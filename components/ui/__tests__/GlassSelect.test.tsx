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
});
