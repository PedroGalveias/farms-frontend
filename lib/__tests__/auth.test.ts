import { describe, expect, it } from "vitest";
import {
  isSameOrigin,
  mapAuthError,
  validateEmailFormat,
  validatePassword,
} from "@/lib/auth";

describe("validateEmailFormat", () => {
  it("accepts plausible addresses", () => {
    expect(validateEmailFormat("a@b.ch")).toBe(true);
    expect(validateEmailFormat("  pedro@example.com  ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const bad of ["", "no-at", "a@b", "a b@c.ch", "a@@b.ch"]) {
      expect(validateEmailFormat(bad)).toBe(false);
    }
  });
});

describe("validatePassword", () => {
  it("accepts a password of at least 12 characters", () => {
    expect(validatePassword("correct horse")).toBeNull();
  });

  it("flags passwords shorter than 12 characters", () => {
    expect(validatePassword("short")).toBe("auth_err_password_short");
  });

  it("flags passwords over the byte limit", () => {
    expect(validatePassword("a".repeat(1025))).toBe("auth_err_password_long");
  });
});

describe("mapAuthError", () => {
  it("maps known statuses to keys", () => {
    expect(mapAuthError(400)).toBe("auth_err_invalid");
    expect(mapAuthError(401)).toBe("auth_err_credentials");
    expect(mapAuthError(429)).toBe("auth_err_rate_limited");
    expect(mapAuthError(500)).toBe("auth_err_generic");
  });
});

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/auth/login", { headers });
}

describe("isSameOrigin", () => {
  it("allows a matching origin", () => {
    expect(
      isSameOrigin(
        request({ origin: "http://localhost:3000", host: "localhost:3000" }),
      ),
    ).toBe(true);
  });

  it("rejects a cross-origin request", () => {
    expect(
      isSameOrigin(
        request({ origin: "http://evil.example", host: "localhost:3000" }),
      ),
    ).toBe(false);
  });

  it("falls back to the referer when origin is absent", () => {
    expect(
      isSameOrigin(
        request({
          referer: "http://localhost:3000/login",
          host: "localhost:3000",
        }),
      ),
    ).toBe(true);
  });

  it("allows requests with neither origin nor referer (relies on SameSite)", () => {
    expect(isSameOrigin(request({ host: "localhost:3000" }))).toBe(true);
  });
});
