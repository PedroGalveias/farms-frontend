import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider, {
  usePersonalization,
} from "@/components/personalization/PersonalizationProvider";
import RecentlyViewedStrip from "@/components/personalization/RecentlyViewedStrip";
import { RECENT_STORAGE_KEY } from "@/lib/personalization";
import type { Farm } from "@/types/farm";

const FARMS: Farm[] = [
  {
    id: "bern",
    name: "Hof Sonnenmatt",
    address: "Dorfstrasse 12, 3011 Bern",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "zurich",
    name: "Bauernhof Grünmatt",
    address: "Feldweg 3, 8001 Zürich",
    canton: "ZH",
    coordinates: "47.3769,8.5417",
    categories: ["Dairy"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
];

function seedRecent(ids: string[]) {
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids));
}

function renderStrip(farms = FARMS) {
  render(
    <LanguageProvider>
      <PersonalizationProvider>
        <RecentlyViewedStrip farms={farms} />
      </PersonalizationProvider>
    </LanguageProvider>,
  );
}

function ClearRecentButton() {
  const { clearRecent } = usePersonalization();
  return (
    <button onClick={clearRecent} type="button">
      Clear recent
    </button>
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe("RecentlyViewedStrip", () => {
  it("renders nothing when there is no recent history", () => {
    const { container } = render(
      <LanguageProvider>
        <PersonalizationProvider>
          <RecentlyViewedStrip farms={FARMS} />
        </PersonalizationProvider>
      </LanguageProvider>,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("lists recently viewed farms, linking to their pages", async () => {
    seedRecent(["bern"]);
    renderStrip();

    const link = await screen.findByRole("link", { name: /Hof Sonnenmatt/i });
    expect(link).toHaveAttribute("href", "/farm/bern");
    expect(screen.getByText(/Dorfstrasse 12/)).toBeInTheDocument();
  });

  it("ignores recent ids that no longer resolve to a loaded farm", async () => {
    seedRecent(["ghost", "zurich"]);
    renderStrip();

    expect(
      await screen.findByRole("link", { name: /Bauernhof Grünmatt/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("clears provider state and persists the canonical empty history", async () => {
    seedRecent(["bern"]);
    render(
      <LanguageProvider>
        <PersonalizationProvider>
          <RecentlyViewedStrip farms={FARMS} />
          <ClearRecentButton />
        </PersonalizationProvider>
      </LanguageProvider>,
    );

    expect(
      await screen.findByRole("link", { name: /Hof Sonnenmatt/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear recent" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Hof Sonnenmatt/i }),
      ).not.toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(RECENT_STORAGE_KEY)).toBe("[]");
  });
});
