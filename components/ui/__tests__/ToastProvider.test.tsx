import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, cleanup } from "@testing-library/react";
import ToastProvider, { useToast } from "@/components/ui/ToastProvider";

function Trigger({ message }: { message: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ message })} type="button">
      fire
    </button>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("ToastProvider", () => {
  it("shows a toast and auto-dismisses it", () => {
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "fire" }).click();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Saved");

    // Visible window + leave animation → gone.
    act(() => vi.advanceTimersByTime(2600 + 240));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("caps the number of simultaneous toasts", () => {
    render(
      <ToastProvider>
        <Trigger message="x" />
      </ToastProvider>,
    );
    const button = screen.getByRole("button", { name: "fire" });
    act(() => {
      for (let i = 0; i < 6; i += 1) button.click();
    });
    expect(screen.getAllByRole("status").length).toBeLessThanOrEqual(3);
  });

  it("useToast is a safe no-op without a provider", () => {
    // Rendering the trigger alone (no ToastProvider) must not throw.
    expect(() => render(<Trigger message="x" />)).not.toThrow();
    act(() => {
      screen.getByRole("button", { name: "fire" }).click();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
