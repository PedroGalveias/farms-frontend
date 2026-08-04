import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  AggregationType,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import {
  VITAL_BUCKETS,
  VITAL_METRICS,
  instrumentNameFor,
  otlpEndpoint,
  recorderFor,
  setVitalRecorder,
  unitFor,
  type VitalHistograms,
} from "@/lib/vitals-metrics";

/**
 * Wire Core Web Vitals up as OTLP histograms.
 *
 * Kept in its own module, imported only from `instrumentation.ts` under a
 * runtime check, because the OTel Node SDK must never be pulled into the edge
 * or client graphs.
 *
 * Export interval is 60s. These are field measurements aggregated over days —
 * a p75 is defined over a 28-day window — so exporting more often buys nothing
 * and costs a request each time. On shutdown the reader is flushed, so the last
 * minute of a deploy is not silently dropped.
 */
export function startVitalsMetrics(): void {
  const endpoint = otlpEndpoint();
  if (!endpoint) {
    // Metrics are off. Deliberately silent: this is the default in local
    // development and CI, not a misconfiguration worth warning about.
    return;
  }

  const exporter = new OTLPMetricExporter({
    url: `${endpoint.replace(/\/$/, "")}/v1/metrics`,
  });

  const provider = new MeterProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "farms-frontend",
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
      "deployment.environment": process.env.NODE_ENV ?? "development",
    }),
    readers: [
      new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 60_000,
      }),
    ],
    // One view per metric, because the bounds are per metric: CLS is a score
    // between 0 and 1, LCP is milliseconds up to ten seconds. A shared default
    // histogram would put every CLS sample in the first bucket and make its
    // p75 unreadable.
    views: VITAL_METRICS.map((metric) => ({
      instrumentName: instrumentNameFor(metric),
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM as const,
        options: { boundaries: VITAL_BUCKETS[metric], recordMinMax: true },
      },
    })),
  });

  const meter = provider.getMeter("farms-frontend-web-vitals");
  const histograms = Object.fromEntries(
    VITAL_METRICS.map((metric) => [
      metric,
      meter.createHistogram(instrumentNameFor(metric), {
        description: `Core Web Vitals ${metric}, as reported by the browser.`,
        unit: unitFor(metric),
      }),
    ]),
  ) as VitalHistograms;

  setVitalRecorder(recorderFor(histograms));

  // Flush on the way out. Without this the final interval's samples — which is
  // every sample since the last export — are lost on every deploy.
  const shutdown = () => {
    setVitalRecorder(null);
    void provider.shutdown().catch(() => {
      // Already shutting down; nothing useful to do with the failure.
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
