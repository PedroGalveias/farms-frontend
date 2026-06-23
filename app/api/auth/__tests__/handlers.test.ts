import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";

afterEach(() => {
  vi.restoreAllMocks();
});

const ORIGIN = "http://localhost:3000";

function req(
  path: string,
  { method = "POST", body = "", cookie = "", origin = ORIGIN } = {},
): NextRequest {
  const headers: Record<string, string> = {
    host: "localhost:3000",
    "content-type": "application/json",
  };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  return new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : body,
  });
}

function backendResponse(
  status: number,
  body: unknown,
  setCookie?: string,
): Response {
  const headers = new Headers({ "content-type": "application/json" });
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

describe("POST /api/auth/login", () => {
  it("relays the backend session cookie onto its own response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      backendResponse(
        200,
        { user_id: "u1", role: "user" },
        "farms-session=abc; Path=/; HttpOnly; SameSite=Lax",
      ),
    );

    const res = await login(
      req("/api/auth/login", { body: JSON.stringify({ email: "a@b.ch" }) }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie().join(";")).toContain("farms-session=abc");
    await expect(res.json()).resolves.toEqual({ user_id: "u1", role: "user" });
  });

  it("passes a 401 through without a cookie", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      backendResponse(401, { error: "invalid" }),
    );
    const res = await login(req("/api/auth/login", { body: "{}" }));
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it("rejects a cross-origin request with 403", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await login(
      req("/api/auth/login", { origin: "http://evil.example" }),
    );
    expect(res.status).toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/register", () => {
  it("passes the backend 202 through verbatim", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(backendResponse(202, null));
    const res = await register(
      req("/api/auth/register", {
        body: JSON.stringify({ email: "a@b.ch", password: "x".repeat(12) }),
      }),
    );
    expect(res.status).toBe(202);
  });

  it("passes a 429 through", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      backendResponse(429, { error: "slow down" }),
    );
    const res = await register(req("/api/auth/register", { body: "{}" }));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie even if the backend is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    const res = await logout(
      req("/api/auth/logout", { cookie: "farms-session=abc" }),
    );
    expect(res.status).toBe(200);
    const cleared = res.headers.getSetCookie().join(";");
    expect(cleared).toContain("farms-session=");
    expect(cleared).toMatch(/Max-Age=0|Expires=/i);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the user when the backend recognizes the session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      backendResponse(200, { user_id: "u1", role: "admin" }),
    );
    const res = await me(
      req("/api/auth/me", { method: "GET", cookie: "farms-session=abc" }),
    );
    await expect(res.json()).resolves.toEqual({
      user: { user_id: "u1", role: "admin" },
    });
  });

  it("returns { user: null } for an anonymous request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(backendResponse(401, null));
    const res = await me(req("/api/auth/me", { method: "GET" }));
    await expect(res.json()).resolves.toEqual({ user: null });
  });
});
