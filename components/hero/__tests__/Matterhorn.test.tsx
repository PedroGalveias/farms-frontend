import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import Matterhorn from "@/components/hero/Matterhorn";

describe("Matterhorn", () => {
  it("renders the detailed two-tone illustration and forwards the class", () => {
    const { container } = render(<Matterhorn className="test-class" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("test-class");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 220 200");
    // Sky, base snow, the warm + cool faces, facets, snow streaks and ridge.
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(
      14,
    );
    // Warm/cool alpenglow gradients define the two-tone look.
    expect(container.querySelectorAll("linearGradient").length).toBeGreaterThan(
      2,
    );
  });
});
