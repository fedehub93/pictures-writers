import type { MetricSummary, WidgetConfig } from "../types";

/**
 * Resolves which Metric a Trend instance should render, given the metrics the
 * user may read and the instance's config.
 *
 * An explicitly configured metric is used only when the user may read it, so a
 * Trend never silently shows a different metric than the one it was set to.
 * An instance with no config (freshly added from the library) falls back to the
 * first permitted metric. Returns `null` when there is nothing to render, in
 * which case the Trend hides itself.
 */
export const resolveMetric = (
  config: WidgetConfig | undefined,
  metrics: MetricSummary[],
): MetricSummary | null => {
  const configured =
    config && typeof config.metric === "string" ? config.metric : null;

  if (configured) {
    return metrics.find((metric) => metric.id === configured) ?? null;
  }

  return metrics[0] ?? null;
};

/**
 * Whether an analytics instance has a metric to render. When the user may read
 * no metric the Trend has nothing to show and is left out of the grid.
 */
export const isAnalyticsInstanceRenderable = (
  config: WidgetConfig | undefined,
  metrics: MetricSummary[],
): boolean => resolveMetric(config, metrics) !== null;
