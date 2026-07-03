import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import CategoryFilterSheet from "@/components/CategoryFilterSheet";

function renderSheet(
  props: Partial<Parameters<typeof CategoryFilterSheet>[0]> = {},
) {
  const base = {
    categoryOptions: ["Gemüse", "Früchte", "Fleisch"],
    categoryCounts: { Gemüse: 817, Früchte: 789, Fleisch: 108 },
    selectedCategories: [] as string[],
    categoryMatchMode: "any" as const,
    onToggleCategory: vi.fn(),
    onCategoryMatchModeChange: vi.fn(),
    onClearCategories: vi.fn(),
    onClose: vi.fn(),
  };
  const merged = { ...base, ...props };
  render(
    <LanguageProvider>
      <CategoryFilterSheet {...merged} />
    </LanguageProvider>,
  );
  return merged;
}

afterEach(cleanup);

describe("CategoryFilterSheet", () => {
  it("lists every category with its count", () => {
    renderSheet();
    expect(screen.getByText("All categories")).toBeInTheDocument();
    // German source labels render as English in the default locale.
    expect(
      screen.getByRole("button", { name: /vegetables/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fruits/i })).toBeInTheDocument();
    expect(screen.getByText("817")).toBeInTheDocument();
  });

  it("toggles a category", async () => {
    const user = userEvent.setup();
    const { onToggleCategory } = renderSheet();
    await user.click(screen.getByRole("button", { name: /vegetables/i }));
    expect(onToggleCategory).toHaveBeenCalledWith("Gemüse");
  });

  it("shows the match-mode toggle only with 2+ selected", () => {
    const { rerender } = { rerender: () => {} } as never;
    void rerender;
    renderSheet({ selectedCategories: ["Gemüse"] });
    expect(
      screen.queryByRole("button", { name: /match all/i }),
    ).not.toBeInTheDocument();
    cleanup();
    renderSheet({ selectedCategories: ["Gemüse", "Früchte"] });
    expect(
      screen.getByRole("button", { name: /match all/i }),
    ).toBeInTheDocument();
  });

  it("closes via Done", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();
    await user.click(screen.getByRole("button", { name: /^done$/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
