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

// jsdom lacks pointer capture.
beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
  document.body.style.overflow = "";
  document.body.classList.remove("sheet-open");
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
    const grabber = document.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 100 + 130, pointerId: 1 }); // > 110
    fireEvent.pointerUp(grabber, { clientY: 230, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("snaps back when the flick is below the threshold", () => {
    setMobile(true);
    const onClose = renderSheet();
    const sheet = screen.getByRole("dialog") as HTMLElement;
    const grabber = document.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 100 + 40, pointerId: 1 }); // < 110
    fireEvent.pointerUp(grabber, { clientY: 140, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
    // Snapped back to rest.
    expect(sheet.style.transform).toBe("");
  });

  it("ignores the drag gesture on desktop (centred modal)", () => {
    setMobile(false);
    const onClose = renderSheet();
    const grabber = document.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(grabber, { clientY: 400, pointerId: 1 });
    fireEvent.pointerUp(grabber, { clientY: 400, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
  });
});
