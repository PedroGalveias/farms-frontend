import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ProfileView from "@/components/profile/ProfileView";

// The auth session comes from /api/auth/me; control it per-test instead.
const authState: {
  user: { user_id: string; role: string } | null;
  loading: boolean;
} = { user: null, loading: false };
const openAuth = vi.fn();
const logout = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ ...authState, openAuth, logout }),
}));

function renderProfile() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <PersonalizationProvider>
          <ProfileView />
        </PersonalizationProvider>
      </LanguageProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  authState.user = null;
  authState.loading = false;
  localStorage.clear();
  document.documentElement.classList.remove("force-motion");
  vi.clearAllMocks();
});

describe("ProfileView", () => {
  it("signed out: shows the sign-in prompt plus the device-local sections", () => {
    renderProfile();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    // The library works without an account; settings live on their own page.
    expect(screen.getByText("Your library")).toBeInTheDocument();
    expect(screen.getByText("Saved farms")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    // No logout, no account section, no WIP fields.
    expect(screen.queryByText(/log out/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/account id/i)).not.toBeInTheDocument();
  });

  it("signed in: shows account data, logout, and the WIP sections", () => {
    authState.user = { user_id: "user-123", role: "user" };
    renderProfile();
    expect(screen.getByText("user-123")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/work in progress/i)).toBeInTheDocument();
  });

  it("links to the settings page", () => {
    renderProfile();
    const settings = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/settings");
    expect(settings).toBeDefined();
    expect(settings).toHaveTextContent("Settings");
  });

  it("library tiles link to the saved page", () => {
    renderProfile();
    const savedLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/saved");
    expect(savedLinks.length).toBeGreaterThanOrEqual(2); // saved + collections
  });
});
