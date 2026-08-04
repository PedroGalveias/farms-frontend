/**
 * Next's server-start hook.
 *
 * Only the Node.js runtime gets the OpenTelemetry SDK: it depends on Node
 * built-ins that the edge runtime does not provide, and importing it
 * unconditionally breaks the edge build rather than degrading. The dynamic
 * import keeps it out of the module graph entirely on other runtimes.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { startVitalsMetrics } = await import("./instrumentation.node");
  startVitalsMetrics();
}
