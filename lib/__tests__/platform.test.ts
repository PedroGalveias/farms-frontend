import { describe, expect, it } from "vitest";
import { isApplePlatform } from "@/lib/platform";

describe("isApplePlatform", () => {
  it("detects Mac / iOS from platform or userAgent", () => {
    expect(isApplePlatform({ platform: "MacIntel" })).toBe(true);
    expect(isApplePlatform({ platform: "iPhone" })).toBe(true);
    expect(
      isApplePlatform({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      }),
    ).toBe(true);
  });

  it("is false for Windows / Linux", () => {
    expect(isApplePlatform({ platform: "Win32" })).toBe(false);
    expect(isApplePlatform({ platform: "Linux x86_64" })).toBe(false);
    expect(
      isApplePlatform({ userAgent: "Mozilla/5.0 (X11; Linux x86_64)" }),
    ).toBe(false);
    expect(isApplePlatform({})).toBe(false);
  });
});
