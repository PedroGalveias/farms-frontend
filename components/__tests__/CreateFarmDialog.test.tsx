import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import CreateFarmDialog from "@/components/CreateFarmDialog";

function renderDialog() {
  return render(
    <LanguageProvider>
      <CreateFarmDialog open onClose={vi.fn()} onSuccess={vi.fn()} />
    </LanguageProvider>,
  );
}

describe("CreateFarmDialog category picker", () => {
  it("expands a category to reveal its subcategories (products)", async () => {
    const user = userEvent.setup();
    renderDialog();

    // Products are hidden until their category is expanded.
    expect(screen.queryByRole("button", { name: "Strawberries" })).toBeNull();

    await user.click(screen.getByRole("button", { name: /fruits/i }));
    expect(
      screen.getByRole("button", { name: "Strawberries" }),
    ).toBeInTheDocument();
  });

  it("selects a subcategory and reflects it on the category header", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /fruits/i }));
    const strawberry = screen.getByRole("button", { name: "Strawberries" });
    await user.click(strawberry);

    expect(strawberry).toHaveAttribute("aria-pressed", "true");
    // The category header now shows a "1" selected-count badge.
    expect(
      screen.getByRole("button", { name: /fruits.*1|1.*fruits/i }),
    ).toBeInTheDocument();
  });
});
