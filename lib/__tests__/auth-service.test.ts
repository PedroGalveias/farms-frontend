import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "@/lib/auth-service";
import { FarmsApiError } from "@/lib/backend";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown = null) {
  const response = new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
}

describe("fetchCurrentUser", () => {
  it("returns the user on 200", async () => {
    mockFetch(200, { user_id: "u1", role: "user" });
    await expect(fetchCurrentUser("farms-session=abc")).resolves.toEqual({
      user_id: "u1",
      role: "user",
    });
  });

  it("returns null on 401 (expired session)", async () => {
    mockFetch(401);
    await expect(fetchCurrentUser("farms-session=stale")).resolves.toBeNull();
  });

  it("short-circuits to null without a backend call when no session cookie", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(fetchCurrentUser("")).resolves.toBeNull();
    await expect(fetchCurrentUser("theme=dark")).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("forwards the cookie header to the backend", async () => {
    const spy = mockFetch(200, { user_id: "u1", role: "admin" });
    await fetchCurrentUser("farms-session=xyz");
    const init = spy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).cookie).toBe(
      "farms-session=xyz",
    );
  });

  it("throws FarmsApiError on an unexpected backend error", async () => {
    mockFetch(500, { error: "boom" });
    await expect(fetchCurrentUser("farms-session=abc")).rejects.toBeInstanceOf(
      FarmsApiError,
    );
  });

  it("treats an unreachable backend as logged-out", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(fetchCurrentUser("farms-session=abc")).resolves.toBeNull();
  });
});
