import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ useReportWebVitals: vi.fn() }));

vi.mock("next/web-vitals", () => ({
  useReportWebVitals: mocks.useReportWebVitals,
}));

import WebVitals, { reportWebVital } from "@/components/WebVitals";

afterEach(() => {
  mocks.useReportWebVitals.mockClear();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "sendBeacon");
});

describe("reportWebVital", () => {
  it("keeps the Next reporting callback stable across renders", () => {
    const { rerender } = render(<WebVitals />);
    const firstCallback = mocks.useReportWebVitals.mock.calls[0][0];

    rerender(<WebVitals />);

    expect(mocks.useReportWebVitals).toHaveBeenCalledTimes(2);
    expect(mocks.useReportWebVitals.mock.calls[1][0]).toBe(firstCallback);
  });

  it("uses sendBeacon when the browser accepts the payload", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    reportWebVital({ name: "LCP", rating: "good", value: 1200 });

    expect(sendBeacon).toHaveBeenCalledWith("/api/vitals", expect.any(String));
    expect(JSON.parse(sendBeacon.mock.calls[0][1])).toEqual({
      name: "LCP",
      path: window.location.pathname,
      rating: "good",
      value: 1200,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to a keepalive fetch when the beacon queue rejects it", () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    reportWebVital({ name: "INP", rating: "needs-improvement", value: 250 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/vitals",
      expect.objectContaining({
        body: expect.stringContaining('"name":"INP"'),
        keepalive: true,
        method: "POST",
      }),
    );
  });
});
