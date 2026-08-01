import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

afterEach(() => cleanup());

function Trapped({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <>
      <button type="button">outside-before</button>
      <div aria-modal="true" ref={ref} role="dialog" tabIndex={-1}>
        <button type="button">first</button>
        <button type="button">middle</button>
        <button disabled type="button">
          disabled
        </button>
        <button type="button">last</button>
      </div>
      <button type="button">outside-after</button>
    </>
  );
}

// jsdom reports 0×0 for everything, so the hook's visibility filter would drop
// every candidate. Give the buttons a real box.
function withSize(name: string) {
  const el = screen.getByText(name);
  el.getBoundingClientRect = () =>
    ({
      width: 80,
      height: 32,
      top: 0,
      left: 0,
      right: 80,
      bottom: 32,
      x: 0,
      y: 0,
    }) as DOMRect;
  return el;
}

function sizeAll() {
  for (const n of ["first", "middle", "disabled", "last"]) withSize(n);
}

describe("useFocusTrap", () => {
  it("wraps from the last element back to the first on Tab", () => {
    render(<Trapped />);
    sizeAll();
    const last = screen.getByText("last");
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByText("first")).toHaveFocus();
  });

  it("wraps from the first element to the last on Shift+Tab", () => {
    render(<Trapped />);
    sizeAll();
    screen.getByText("first").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("wraps Shift+Tab from an initially focused dialog container", () => {
    render(<Trapped />);
    sizeAll();
    const dialog = screen.getByRole("dialog");
    dialog.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("pulls focus back in when it has escaped the dialog", () => {
    render(<Trapped />);
    sizeAll();
    screen.getByText("outside-after").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByText("first")).toHaveFocus();
  });

  it("skips disabled controls when choosing the last element", () => {
    render(<Trapped />);
    sizeAll();
    // "disabled" sits between middle and last; Shift+Tab from first must land
    // on "last", never on the disabled button.
    screen.getByText("first").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByText("disabled")).not.toHaveFocus();
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("leaves focus alone while inactive (non-modal presentations)", () => {
    render(<Trapped active={false} />);
    sizeAll();
    const outside = screen.getByText("outside-after");
    outside.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(outside).toHaveFocus();
  });

  it("ignores keys other than Tab", () => {
    render(<Trapped />);
    sizeAll();
    const outside = screen.getByText("outside-after");
    outside.focus();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(outside).toHaveFocus();
  });
});
