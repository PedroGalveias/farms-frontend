import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import SideRail from "@/components/SideRail";
import { translate } from "@/lib/i18n";

const pathname = vi.hoisted(() => ({ value: "/" }));
// Signed out by default — the state the settings link exists for.
const auth = vi.hoisted(() => ({
  user: null as { username?: string; role?: string } | null,
}));

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

function renderRail(path = "/") {
  pathname.value = path;
  return render(
    <LanguageProvider>
      <ThemeProvider>
        <PersonalizationProvider>
          <SideRail />
        </PersonalizationProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

const settingsLabel = translate("en", "settings_title");

describe("SideRail settings entry", () => {
  it("offers settings to a signed-out visitor", () => {
    // The whole point: every control on /settings is a per-device preference,
    // and before this the only route there was via /profile, which the account
    // menu only offers once you are signed in.
    auth.user = null;
    renderRail();

    const link = screen.getByTitle(settingsLabel);
    expect(link.getAttribute("href")).toBe("/settings");
  });

  it("still offers settings when signed in", () => {
    auth.user = { role: "user", username: "pedro" };
    renderRail();

    expect(screen.getByTitle(settingsLabel).getAttribute("href")).toBe(
      "/settings",
    );
  });

  it("marks itself as the current page on /settings", () => {
    auth.user = null;
    renderRail("/settings");

    expect(screen.getByTitle(settingsLabel)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not claim to be current on another route", () => {
    auth.user = null;
    renderRail("/saved");

    expect(screen.getByTitle(settingsLabel)).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks itself current on a locale-prefixed settings route", () => {
    // usePathname returns the real URL, so /de/settings has to be recognised
    // too — otherwise the rail highlights nothing for four of the five
    // languages, which is how it behaved before this.
    auth.user = null;
    renderRail("/de/settings");

    expect(screen.getByTitle(settingsLabel)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks the primary nav current on a locale-prefixed route", () => {
    auth.user = null;
    renderRail("/de/saved");

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it("leaves the primary navigation alone", () => {
    // Settings belongs to the utility cluster. Putting it in <nav> would hand
    // it to the sliding indicator, which is positioned within that element.
    auth.user = null;
    renderRail("/settings");

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav.querySelector('a[href="/settings"]')).toBeNull();
  });
});
