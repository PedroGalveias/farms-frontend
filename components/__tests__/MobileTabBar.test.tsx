import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import MobileTabBar from "@/components/MobileTabBar";
import { FAVORITES_STORAGE_KEY } from "@/lib/personalization";

const pathname = vi.hoisted(() => ({ value: "/" }));
const haptic = vi.hoisted(() => vi.fn());

vi.mock("@/lib/haptics", () => ({ haptic }));

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

afterEach(() => {
  pathname.value = "/";
  window.localStorage.clear();
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 0,
  });
  vi.restoreAllMocks();
  haptic.mockClear();
});

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

  it("marks Saved active and shows the persisted favourite count", async () => {
    pathname.value = "/saved";
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(["farm-1", "farm-2"]),
    );
    renderBar();

    const saved = screen.getByRole("link", { name: "Saved" });
    expect(saved).toHaveAttribute("aria-current", "page");
    await waitFor(() => expect(saved).toHaveTextContent("2"));
  });

  it("has no active tab away from the three primary routes", () => {
    pathname.value = "/profile";
    renderBar();

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("gives haptic feedback when a tab is selected", () => {
    renderBar();
    const search = screen.getByRole("link", { name: /quick search/i });
    // Keep jsdom on this document while still exercising the link's click
    // handler (real navigation belongs to the browser/e2e suite).
    search.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(search);
    expect(haptic).toHaveBeenCalledOnce();
  });

  it("hides while scrolling down and restores keyboard access while scrolling up", async () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      queueMicrotask(() => callback(0));
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    await act(async () => {
      renderBar();
      await Promise.resolve();
    });
    const navigation = screen.getByRole("navigation", { name: "Primary" });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 120,
    });
    await act(async () => {
      fireEvent.scroll(window);
      await Promise.resolve();
    });
    expect(navigation).toHaveAttribute("data-hidden", "true");
    expect(navigation).toHaveAttribute("aria-hidden", "true");
    expect(navigation).toHaveAttribute("inert");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 60,
    });
    await act(async () => {
      fireEvent.scroll(window);
      await Promise.resolve();
    });
    expect(navigation).not.toHaveAttribute("data-hidden");
    expect(navigation).not.toHaveAttribute("aria-hidden");
    expect(navigation).not.toHaveAttribute("inert");
  });
});
