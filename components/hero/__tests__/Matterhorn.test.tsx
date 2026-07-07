import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import Matterhorn from "@/components/hero/Matterhorn";

describe("Matterhorn", () => {
  it("renders an SVG with layered mountain paths and forwards the class", () => {
    const { container } = render(<Matterhorn className="test-class" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("test-class");
    // Back ranges, the peak, the sunlit face, and the snow-line stroke.
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(4);
    expect(svg?.getAttribute("viewBox")).toBe("0 0 400 240");
  });
});
