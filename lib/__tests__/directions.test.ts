import { describe, expect, it } from "vitest";
import { detectDirectionsPlatform, directionsUrl } from "@/lib/directions";

describe("detectDirectionsPlatform", () => {
  it("detects iOS and Android user agents", () => {
    expect(
      detectDirectionsPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS)"),
    ).toBe("ios");
    expect(detectDirectionsPlatform("Mozilla/5.0 (Linux; Android 15)")).toBe(
      "android",
    );
  });

  it("falls back to web for desktop browsers", () => {
    expect(
      detectDirectionsPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)"),
    ).toBe("web");
  });
});

describe("directionsUrl", () => {
  it("uses Apple Maps links on iOS", () => {
    expect(directionsUrl("46.9480,7.4474", "ios")).toBe(
      "maps://?daddr=46.948%2C7.4474",
    );
  });

  it("uses geo intents on Android", () => {
    expect(directionsUrl("46.9480,7.4474", "android")).toBe(
      "geo:0,0?q=46.948%2C7.4474",
    );
  });

  it("uses Google Maps on the web", () => {
    expect(directionsUrl("46.9480,7.4474")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=46.948%2C7.4474",
    );
  });
});
