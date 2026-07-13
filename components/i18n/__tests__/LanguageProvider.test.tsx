import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider, {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import { de } from "@/lib/messages/de";

const push = vi.fn();
const pathname = { value: "/" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname.value,
  useSearchParams: () => new URLSearchParams(),
}));

function Probe() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="copy">{t("settings_title")}</span>
      <button onClick={() => setLocale("de")} type="button">
        de
      </button>
      <button onClick={() => setLocale("en")} type="button">
        en
      </button>
    </div>
  );
}

beforeEach(() => {
  push.mockClear();
  pathname.value = "/";
  document.cookie = "farms.locale=;path=/;max-age=0";
  localStorage.clear();
});

describe("LanguageProvider (locale from the URL)", () => {
  it("translates from the initialLocale (SSR source of truth)", () => {
    // The server layout supplies the active locale's table; mirror that here.
    render(
      <LanguageProvider initialLocale="de" messages={de}>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("de");
    expect(screen.getByTestId("copy")).toHaveTextContent("Einstellungen");
  });

  it("switching navigates to the localized path and persists the cookie", () => {
    pathname.value = "/canton/be";
    render(
      <LanguageProvider initialLocale="en">
        <Probe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "de" }));
    expect(push).toHaveBeenCalledWith("/de/canton/be");
    expect(document.cookie).toContain("farms.locale=de");
    expect(localStorage.getItem("farms.locale")).toBe("de");
  });

  it("switching back to English strips the locale segment", () => {
    pathname.value = "/de/product/dairy";
    render(
      <LanguageProvider initialLocale="de">
        <Probe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "en" }));
    expect(push).toHaveBeenCalledWith("/product/dairy");
  });

  it("defaults to English without an initialLocale", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });
});
