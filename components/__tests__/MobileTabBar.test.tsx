import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import MobileTabBar from "@/components/MobileTabBar";

const pathname = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
}));

function renderBar() {
  return render(
    <LanguageProvider>
      <PersonalizationProvider>
        <MobileTabBar />
      </PersonalizationProvider>
    </LanguageProvider>,
  );
}

describe("MobileTabBar", () => {
  it("renders both navigation tabs", () => {
    pathname.value = "/";
    renderBar();
    expect(
      screen.getByRole("link", { name: /directory/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /quick search/i }),
    ).toBeInTheDocument();
  });

  it("marks Directory active on the home route", () => {
    pathname.value = "/";
    renderBar();
    expect(screen.getByRole("link", { name: /directory/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /quick search/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks Quick search active on the quick-search route", () => {
    pathname.value = "/quick-search";
    renderBar();
    expect(screen.getByRole("link", { name: /quick search/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
