import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/vitals/route";
import { setVitalRecorder } from "@/lib/vitals-metrics";

function request(body: string) {
  return new Request("http://localhost:3000/api/vitals", {
    body,
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setVitalRecorder(null);
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

  it("never lets a crafted path reach the log", async () => {
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
    // The path is folded to a route group before anything is logged, so an
    // unrecognised one becomes "other" and the CR/LF has nowhere to land. This
    // is stronger than the sanitiser it replaced: log injection is now
    // structurally impossible rather than escaped away.
    //
    // The rating is recomputed too — the payload claimed "good", but CLS 0.12
    // is past the 0.1 threshold.
    expect(info).toHaveBeenCalledWith(
      "[web-vitals] CLS=0 needs-improvement other desktop",
    );
  });

  it("records the metric with its route group and device class", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const recorder = vi.fn();
    setVitalRecorder(recorder);

    const response = await POST(
      new Request("http://localhost:3000/api/vitals", {
        body: JSON.stringify({
          name: "LCP",
          path: "/de/canton/be",
          rating: "poor",
          value: 2180,
        }),
        headers: {
          "content-type": "application/json",
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(204);
    // Locale stripped, canton folded to its template, device from the UA, and
    // the rating recomputed rather than trusted (2180ms LCP is "good").
    expect(recorder).toHaveBeenCalledWith("LCP", 2180, {
      route: "/canton/[code]",
      device: "mobile",
      rating: "good",
    });
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
