import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/vitals/route";

function request(body: string) {
  return new Request("http://localhost:3000/api/vitals", {
    body,
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/vitals", () => {
  it("rejects cross-origin telemetry before parsing or logging it", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await POST(
      new Request("http://localhost:3000/api/vitals", {
        body: "not-json",
        headers: { host: "localhost:3000", origin: "https://evil.example" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(info).not.toHaveBeenCalled();
  });

  it("logs a finite allowed metric with log-safe context", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(
      request(
        JSON.stringify({
          name: "CLS",
          path: "/farms\r\nforged",
          rating: "good",
          value: 0.12,
        }),
      ),
    );

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith("[web-vitals] CLS=0 good /farmsforged");
  });

  it("does not log non-finite metric values", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    // JSON.parse accepts this as Infinity, while JSON.stringify would turn it
    // into null. Keep malformed telemetry out of the platform logs.
    const response = await POST(
      request('{"name":"LCP","rating":"good","value":1e400}'),
    );

    expect(response.status).toBe(204);
    expect(info).not.toHaveBeenCalled();
  });
});
