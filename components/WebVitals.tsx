"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Streams Core Web Vitals to /api/vitals via sendBeacon (falling back to a
 * keepalive fetch). No third-party analytics; the endpoint only logs the metric
 * and pathname. Renders nothing.
 */
export default function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body);
    } else {
      void fetch("/api/vitals", {
        body,
        keepalive: true,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    }
  });

  return null;
}
