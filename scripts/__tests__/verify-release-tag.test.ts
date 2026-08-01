import { describe, expect, it } from "vitest";
import {
  compareReleaseVersions,
  parseReleaseTag,
  verifyReleaseTag,
} from "../verify-release-tag.mjs";

describe("verifyReleaseTag", () => {
  it("accepts the first release and a later patch or minor release", () => {
    expect(verifyReleaseTag("v0.1.0", [])).toBeUndefined();
    expect(verifyReleaseTag("v0.12.4", ["v0.12.3"])).toBe("v0.12.3");
    expect(verifyReleaseTag("v0.13.0", ["v0.12.3", "v0.12.4"])).toBe("v0.12.4");
  });

  it("uses semantic ordering rather than lexical ordering", () => {
    expect(verifyReleaseTag("v0.10.0", ["v0.9.9"])).toBe("v0.9.9");
    expect(compareReleaseVersions([1, 10, 0], [1, 9, 9])).toBeGreaterThan(0);
  });

  it("rejects malformed, duplicate, and backwards tags", () => {
    expect(parseReleaseTag("v1.2")).toBeNull();
    expect(() => verifyReleaseTag("v1.2", [])).toThrow(/release format/i);
    expect(() => verifyReleaseTag("v0.12.4", ["v0.12.4"])).toThrow(
      /newer than the latest/i,
    );
    expect(() => verifyReleaseTag("v0.12.3", ["v0.12.4"])).toThrow(
      /newer than the latest/i,
    );
  });

  it("ignores non-release tags while finding the newest release", () => {
    expect(
      verifyReleaseTag("v0.13.0", ["preview", "v0.9.9", "v0.12.4-beta"]),
    ).toBe("v0.9.9");
  });
});
