import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/command/events";

// Keep the test focused on the eager event bridge. The real component is
// covered by the browser accessibility test once its dynamic chunk arrives.
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ initiallyOpen }: { initiallyOpen?: boolean }) => (
      <output data-testid="palette-state">
        {initiallyOpen ? "open" : "closed"}
      </output>
    ),
}));

import LazyCommandPalette from "@/components/command/LazyCommandPalette";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LazyCommandPalette", () => {
  it("remembers a rail-open event while the palette chunk is loading", () => {
    render(<LazyCommandPalette />);
    expect(screen.getByTestId("palette-state")).toHaveTextContent("closed");

    act(() => {
      window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
    });

    expect(screen.getByTestId("palette-state")).toHaveTextContent("open");
  });

  it("claims the initial mod-K shortcut before the palette chunk arrives", () => {
    render(<LazyCommandPalette />);
    const event = new KeyboardEvent("keydown", {
      cancelable: true,
      ctrlKey: true,
      key: "k",
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByTestId("palette-state")).toHaveTextContent("open");
  });
});
