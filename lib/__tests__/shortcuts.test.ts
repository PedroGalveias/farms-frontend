import { describe, expect, it } from "vitest";
import { GO_SHORTCUTS, gChordHref } from "@/lib/shortcuts";

describe("gChordHref", () => {
  it("maps bound keys to their route, case-insensitively", () => {
    expect(gChordHref("h")).toBe("/");
    expect(gChordHref("S")).toBe("/saved");
    expect(gChordHref("q")).toBe("/quick-search");
    expect(gChordHref("c")).toBe("/seasonal");
  });

  it("returns null for unbound keys", () => {
    expect(gChordHref("x")).toBeNull();
    expect(gChordHref("")).toBeNull();
  });

  it("keeps every shortcut key unique", () => {
    const keys = GO_SHORTCUTS.map((shortcut) => shortcut.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
