import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { useLongPress } from "@/components/motion/useLongPress";

vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));

function Probe({
  onLongPress,
  onClick,
}: {
  onLongPress?: () => void;
  onClick: () => void;
}) {
  const press = useLongPress(onLongPress, onClick);
  return (
    <button type="button" {...press}>
      target
    </button>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("useLongPress", () => {
  it("fires onLongPress after the hold and swallows the trailing click", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    render(<Probe onClick={onClick} onLongPress={onLongPress} />);
    const el = screen.getByRole("button");

    fireEvent.pointerDown(el, { pointerType: "touch", clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    // The click that follows a long-press must be suppressed.
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("treats a quick tap as a click (no long-press)", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    render(<Probe onClick={onClick} onLongPress={onLongPress} />);
    const el = screen.getByRole("button");

    fireEvent.pointerDown(el, { pointerType: "touch", clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(120);
    fireEvent.pointerUp(el);
    fireEvent.click(el);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("cancels the press when the finger drifts (a scroll)", () => {
    const onLongPress = vi.fn();
    render(<Probe onClick={vi.fn()} onLongPress={onLongPress} />);
    const el = screen.getByRole("button");

    fireEvent.pointerDown(el, { pointerType: "touch", clientX: 0, clientY: 0 });
    fireEvent.pointerMove(el, { clientX: 0, clientY: 40 });
    vi.advanceTimersByTime(500);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("ignores mouse pointers (click only)", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    render(<Probe onClick={onClick} onLongPress={onLongPress} />);
    const el = screen.getByRole("button");

    fireEvent.pointerDown(el, { pointerType: "mouse", clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(500);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
