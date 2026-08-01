import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import SiteHeader from "@/components/SiteHeader";
import { translate } from "@/lib/i18n";

const pathname = vi.hoisted(() => ({ value: "/" }));
// Signed out by default — the state the settings entry exists for.
const auth = vi.hoisted(() => ({ user: null as { role?: string } | null }));

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

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: auth.user,
    loading: false,
    openAuth: () => {},
    logout: () => {},
  }),
}));

function renderHeader(path = "/") {
  pathname.value = path;
  return render(
    <LanguageProvider>
      <ThemeProvider>
        <SiteHeader />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

const settingsLabel = translate("en", "settings_title");

describe("SiteHeader settings entry", () => {
  it("offers settings to a signed-out visitor", () => {
    auth.user = null;
    renderHeader();

    expect(screen.getByLabelText(settingsLabel).getAttribute("href")).toBe(
      "/settings?returnTo=%2F",
    );
  });

  it("sits with the other preference controls, not in the tab bar", () => {
    // The bottom tab bar is primary navigation and hides itself on scroll, so
    // a control placed there is intermittently unreachable. The header pill is
    // always present and already holds account, theme and language.
    auth.user = null;
    const { container } = renderHeader();

    const header = container.querySelector("header");
    expect(header?.querySelector('a[href*="/settings"]')).not.toBeNull();
  });

  it("marks itself as the current page on /settings", () => {
    auth.user = null;
    renderHeader("/settings");

    expect(screen.getByLabelText(settingsLabel)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("recognises a locale-prefixed settings route", () => {
    auth.user = null;
    renderHeader("/de/settings");

    expect(screen.getByLabelText(settingsLabel)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not claim to be current elsewhere", () => {
    auth.user = null;
    renderHeader("/saved");

    expect(screen.getByLabelText(settingsLabel)).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps the wordmark out of the way on the narrowest phones", () => {
    // Measured, not guessed: at 320px the brand wordmark plus four utilities
    // pushed the settings gear outside the pill and scrolled the page
    // sideways. The wordmark gives way; the control does not.
    auth.user = null;
    const { container } = renderHeader();

    const wordmark = Array.from(container.querySelectorAll("span")).find(
      (node) => node.textContent === "farms",
    );
    expect(wordmark?.className).toContain("max-[359px]:hidden");
  });
});
