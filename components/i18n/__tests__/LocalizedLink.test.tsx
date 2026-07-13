import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderAt(locale: "en" | "de", href: string) {
  cleanup();
  render(
    <LanguageProvider initialLocale={locale}>
      <LocalizedLink href={href}>link</LocalizedLink>
    </LanguageProvider>,
  );
  return screen.getByRole("link").getAttribute("href");
}

describe("LocalizedLink", () => {
  it("leaves English hrefs unprefixed", () => {
    expect(renderAt("en", "/canton/be")).toBe("/canton/be");
    expect(renderAt("en", "/")).toBe("/");
  });

  it("prefixes internal hrefs with a non-English locale", () => {
    expect(renderAt("de", "/canton/be")).toBe("/de/canton/be");
    expect(renderAt("de", "/")).toBe("/de");
  });

  it("preserves query and hash while prefixing", () => {
    expect(renderAt("de", "/?cat=Gemüse")).toBe("/de?cat=Gemüse");
    expect(renderAt("de", "/settings#theme")).toBe("/de/settings#theme");
  });

  it("never touches external, protocol-relative, or in-page hrefs", () => {
    expect(renderAt("de", "https://example.com")).toBe("https://example.com");
    expect(renderAt("de", "//cdn.example.com/x")).toBe("//cdn.example.com/x");
    expect(renderAt("de", "#top")).toBe("#top");
    expect(renderAt("de", "mailto:a@b.ch")).toBe("mailto:a@b.ch");
  });

  it("does not double-prefix an already-localized href", () => {
    expect(renderAt("de", "/de/canton/be")).toBe("/de/canton/be");
    expect(renderAt("de", "/fr/product/dairy")).toBe("/fr/product/dairy");
  });
});
