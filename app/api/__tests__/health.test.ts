import { describe, expect, it } from "vitest";
import { GET, HEAD } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns an ok JSON payload", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      service: "farm-frontend",
      status: "ok",
    });
    expect(typeof body.checkedAt).toBe("string");
  });

  it("disables caching", async () => {
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });
});

describe("HEAD /api/health", () => {
  it("returns 200 with no body", async () => {
    const response = await HEAD();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
});
