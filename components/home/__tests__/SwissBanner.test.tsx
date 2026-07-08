import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import SwissBanner from "@/components/home/SwissBanner";

function renderBanner() {
  return render(
    <LanguageProvider>
      <SwissBanner />
    </LanguageProvider>,
  );
}

describe("SwissBanner", () => {
  it("renders the proudly-Swiss copy from i18n", () => {
    renderBanner();
    expect(screen.getByText("Proudly Swiss")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Every farm, one country" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/every farm in this directory is Swiss/i)).toBeInTheDocument();
  });

  it("frames an ambient flag (canvas or its SVG fallback)", () => {
    const { container } = renderBanner();
    // jsdom has no WebGL, so SwissFlagGlass renders its <canvas> first and
    // swaps to the SVG fallback after the effect; either way the framed flag
    // element is present and decorative.
    const flag =
      container.querySelector("canvas") ?? container.querySelector("svg");
    expect(flag).not.toBeNull();
  });
});
