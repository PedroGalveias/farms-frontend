import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import CantonRail from "@/components/home/CantonRail";

const CANTON_COUNTS = { BE: 2, ZH: 1 };

function renderRail(selectedCanton = "all", onSelectCanton = vi.fn()) {
  render(
    <LanguageProvider>
      <CantonRail
        cantonCounts={CANTON_COUNTS}
        onSelectCanton={onSelectCanton}
        selectedCanton={selectedCanton}
      />
    </LanguageProvider>,
  );
  return onSelectCanton;
}

describe("CantonRail", () => {
  it("renders nothing without canton counts", () => {
    const { container } = render(
      <LanguageProvider>
        <CantonRail
          cantonCounts={{}}
          onSelectCanton={vi.fn()}
          selectedCanton="all"
        />
      </LanguageProvider>,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("lists cantons busiest-first with counts and a hub link", () => {
    renderRail();

    const chips = screen.getAllByRole("button");
    expect(chips[0]).toHaveTextContent(/Bern/);
    expect(chips[0]).toHaveTextContent("2");
    expect(chips[1]).toHaveTextContent(/Zurich|Zürich/);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/canton");
  });

  it("selects a canton on tap and clears it on a second tap", () => {
    const onSelect = renderRail();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelect).toHaveBeenCalledWith("BE");

    const onSelectActive = vi.fn();
    render(
      <LanguageProvider>
        <CantonRail
          cantonCounts={CANTON_COUNTS}
          onSelectCanton={onSelectActive}
          selectedCanton="BE"
        />
      </LanguageProvider>,
    );
    const active = screen
      .getAllByRole("button")
      .find((el) => el.getAttribute("aria-pressed") === "true");
    expect(active).toBeDefined();
    fireEvent.click(active!);
    expect(onSelectActive).toHaveBeenCalledWith("all");
  });

  it("ignores malformed blank canton entries", () => {
    render(
      <LanguageProvider>
        <CantonRail
          cantonCounts={{ "": 10, BE: 2 }}
          onSelectCanton={vi.fn()}
          selectedCanton="all"
        />
      </LanguageProvider>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button")).toHaveTextContent(/Bern/);
  });
});
