"use client";

import { useCallback } from "react";
import { useReportWebVitals } from "next/web-vitals";

interface ReportedMetric {
  name: string;
  rating: string;
  value: number;
}

/**
 * Send a single metric without holding up page teardown. `sendBeacon` can
 * refuse a payload when its queue is full, so a truthy function alone is not
 * enough — fall back to a keepalive request whenever it returns false.
 */
export function reportWebVital(metric: ReportedMetric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: window.location.pathname,
  });

  if (navigator.sendBeacon?.("/api/vitals", body)) {
    return;
  }

  void fetch("/api/vitals", {
    body,
    keepalive: true,
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {
    // Observability must never surface as a visitor-facing error.
  });
}

/**
 * Streams Core Web Vitals to /api/vitals via sendBeacon (falling back to a
 * keepalive fetch when the beacon queue is full). No third-party analytics;
 * the endpoint records only the metric and pathname. Renders nothing.
 */
export default function WebVitals() {
  // Next's hook subscribes inside an effect keyed by this callback. Keep it
  // stable so an unrelated layout/provider render cannot re-register every
  // Web Vitals observer and duplicate a report.
  const onReportWebVitals = useCallback((metric: ReportedMetric) => {
    reportWebVital(metric);
  }, []);

  useReportWebVitals(onReportWebVitals);

  return null;
}
