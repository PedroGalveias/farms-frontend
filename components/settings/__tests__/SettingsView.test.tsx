import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import SettingsView from "@/components/settings/SettingsView";

const authState: {
  user: { user_id: string; role: string } | null;
  loading: boolean;
} = { user: null, loading: false };
const logout = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ ...authState, openAuth: vi.fn(), logout }),
}));

function renderSettings() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <SettingsView />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  authState.user = null;
  localStorage.clear();
  document.documentElement.classList.remove("dark", "force-motion");
  vi.clearAllMocks();
});

describe("SettingsView", () => {
  it("offers the four appearance modes and applies a manual pick", () => {
    renderSettings();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
    fireEvent.click(screen.getByRole("radio", { name: /dark/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("farms.themeMode")).toBe("dark");
    fireEvent.click(screen.getByRole("radio", { name: /light/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("farms.themeMode")).toBe("light");
  });

  it("system mode resolves from prefers-color-scheme", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("radio", { name: /system/i }));
    expect(localStorage.getItem("farms.themeMode")).toBe("system");
    // The shared test stub reports "no match" → light.
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("sun mode stores the mode and resolves from the clock", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("radio", { name: /sun cycle/i }));
    expect(localStorage.getItem("farms.themeMode")).toBe("sun");
    // Resolution depends on the wall clock; assert it committed a resolution.
    expect(localStorage.getItem("farms.theme")).toMatch(/^(light|dark)$/);
  });

  it("sound and haptics toggles persist their off state", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /sound feedback/i }));
    expect(localStorage.getItem("farms.sound")).toBe("off");
    fireEvent.click(screen.getByRole("button", { name: /haptic feedback/i }));
    expect(localStorage.getItem("farms.haptics")).toBe("off");
  });

  it("reset requires a second confirming tap", () => {
    localStorage.setItem("farms.favorites", JSON.stringify(["x"]));
    renderSettings();
    const reset = screen.getByRole("button", { name: /reset…/i });
    fireEvent.click(reset);
    // First tap arms the confirm state — nothing removed yet.
    expect(localStorage.getItem("farms.favorites")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /tap to confirm/i }),
    ).toBeInTheDocument();
  });

  it("shows the account block (with WIP actions) only when signed in", () => {
    renderSettings();
    expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument();
    authState.user = { user_id: "u1", role: "user" };
    renderSettings();
    expect(screen.getByText(/delete account/i)).toBeInTheDocument();
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });
});
