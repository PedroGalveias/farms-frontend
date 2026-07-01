import { describe, expect, it } from "vitest";
import {
  hasSessionCookie,
  isSameOrigin,
  mapAuthError,
  normaliseUsername,
  validateEmailFormat,
  validatePassword,
  validateUsername,
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

describe("normaliseUsername", () => {
  it("trims and lowercases", () => {
    expect(normaliseUsername("  Green-Acres  ")).toBe("green-acres");
    expect(normaliseUsername("FARMER_42")).toBe("farmer_42");
  });
});

describe("validateUsername", () => {
  it("accepts valid usernames (case-insensitively)", () => {
    expect(validateUsername("green-acres")).toBeNull();
    expect(validateUsername("Farmer_42")).toBeNull();
    expect(validateUsername("abc")).toBeNull();
    expect(validateUsername("a".repeat(30))).toBeNull();
  });

  it("flags too short / too long", () => {
    expect(validateUsername("ab")).toBe("auth_err_username_short");
    expect(validateUsername("  a ")).toBe("auth_err_username_short");
    expect(validateUsername("a".repeat(31))).toBe("auth_err_username_long");
  });

  it("rejects bad characters and bad starts", () => {
    for (const bad of ["-abc", "_abc", "ab c", "ab@c", "über", "ab.c"]) {
      expect(validateUsername(bad)).toBe("auth_err_username_invalid");
    }
  });

  it("rejects reserved names, case-insensitively", () => {
    expect(validateUsername("admin")).toBe("auth_err_username_reserved");
    expect(validateUsername("ADMIN")).toBe("auth_err_username_reserved");
    expect(validateUsername("Farms")).toBe("auth_err_username_reserved");
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

describe("hasSessionCookie", () => {
  it("detects the session cookie among others", () => {
    expect(hasSessionCookie("farms-session=abc")).toBe(true);
    expect(hasSessionCookie("theme=dark; farms-session=abc; lang=en")).toBe(
      true,
    );
  });

  it("returns false when absent (and isn't fooled by similar names)", () => {
    expect(hasSessionCookie("")).toBe(false);
    expect(hasSessionCookie("theme=dark")).toBe(false);
    expect(hasSessionCookie("not-farms-session=abc")).toBe(false);
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
