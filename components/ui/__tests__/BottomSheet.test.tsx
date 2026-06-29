import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BottomSheet from "@/components/ui/BottomSheet";

afterEach(() => {
  cleanup();
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
});
