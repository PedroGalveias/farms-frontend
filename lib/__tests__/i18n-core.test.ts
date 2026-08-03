import { describe, expect, it } from "vitest";
import { localizeHref } from "@/lib/i18n-core";

describe("localizeHref", () => {
  it("prefixes an app-absolute path", () => {
    expect(localizeHref("/canton", "de")).toBe("/de/canton");
    expect(localizeHref("/canton", "en")).toBe("/canton");
  });

  it("leaves anything that is not an app path alone", () => {
    for (const href of [
      "https://example.ch",
      "//cdn.example.ch/a",
      "#section",
      "mailto:hof@example.ch",
    ]) {
      expect(localizeHref(href, "de")).toBe(href);
    }
  });

  it("does not double-prefix an already-localized path", () => {
    expect(localizeHref("/de/canton/be", "de")).toBe("/de/canton/be");
    expect(localizeHref("/fr/canton/be", "de")).toBe("/fr/canton/be");
  });

  it("keeps the whole query and hash, including repeated delimiters", () => {
    // `split("#")` dropped everything after a second delimiter, so a query
    // carrying a literal "#" or a hash containing one was silently truncated.
    expect(localizeHref("/canton?a=1#x#y", "de")).toBe("/de/canton?a=1#x#y");
    expect(localizeHref("/canton?a=1&b=2", "de")).toBe("/de/canton?a=1&b=2");
    expect(localizeHref("/canton?q=a%23b", "de")).toBe("/de/canton?q=a%23b");
    expect(localizeHref("/canton#", "de")).toBe("/de/canton#");
  });

  it("passes non-string hrefs through untouched", () => {
    const obj = { pathname: "/canton" };
    expect(localizeHref(obj, "de")).toBe(obj);
  });
});
