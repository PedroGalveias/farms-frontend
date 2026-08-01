import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/command/events";

const mocks = vi.hoisted(() => ({
  firstMountProps: [] as boolean[],
  load: undefined as (() => void) | undefined,
}));

// Keep the test focused on the eager event bridge. The real component is
// covered by the browser accessibility test once its dynamic chunk arrives.
vi.mock("next/dynamic", async () => {
  const React = await import("react");

  function LoadedPalette({ initiallyOpen }: { initiallyOpen?: boolean }) {
    const [openedOnMount] = React.useState(() => {
      mocks.firstMountProps.push(Boolean(initiallyOpen));
      return Boolean(initiallyOpen);
    });
    return <output data-testid="palette-state">{String(openedOnMount)}</output>;
  }

  return {
    default: () => {
      function DeferredPalette({ initiallyOpen }: { initiallyOpen?: boolean }) {
        const [loaded, setLoaded] = React.useState(false);
        React.useEffect(() => {
          mocks.load = () => setLoaded(true);
          return () => {
            mocks.load = undefined;
          };
        }, []);
        return loaded ? <LoadedPalette initiallyOpen={initiallyOpen} /> : null;
      }
      return DeferredPalette;
    },
  };
});

import LazyCommandPalette from "@/components/command/LazyCommandPalette";

afterEach(() => {
  mocks.firstMountProps.length = 0;
  mocks.load = undefined;
  vi.restoreAllMocks();
});

function loadPalette() {
  expect(mocks.load).toBeTypeOf("function");
  act(() => mocks.load?.());
}

describe("LazyCommandPalette", () => {
  it("remembers a rail-open event while the palette chunk is loading", () => {
    render(<LazyCommandPalette />);
    expect(screen.queryByTestId("palette-state")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
    });

    loadPalette();

    expect(mocks.firstMountProps).toEqual([true]);
    expect(screen.getByTestId("palette-state")).toHaveTextContent("true");
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
    loadPalette();

    expect(mocks.firstMountProps).toEqual([true]);
    expect(screen.getByTestId("palette-state")).toHaveTextContent("true");
  });
});
