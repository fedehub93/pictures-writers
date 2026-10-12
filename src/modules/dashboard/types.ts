import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

/**
 * Discrete size token for a Dashboard widget. Fixed per definition in v1 —
 * it is not user-adjustable.
 */
export type WidgetSize = "small" | "medium" | "full";

/**
 * The fascia a Dashboard widget belongs to. Operational widgets surface what
 * needs attention now and ignore the shared date range; analytics widgets are
 * Trend instances governed by it. Defaults to `operational`.
 */
export type WidgetCategory = "operational" | "analytics";

/**
 * Config carried by a Dashboard widget instance. The concrete shape is owned by
 * the widget definition's `configSchema`; it is stored as opaque JSON so a
 * definition can become configurable without a model change.
 */
export type WidgetConfig = Record<string, unknown> | null;

/**
 * An instance of a Widget definition as placed on a user's Dashboard layout.
 *
 * `key` is a stable instance key: registry defaults use deterministic keys
 * (e.g. `drafts`) while user-created instances get a generated key, so
 * reordering or reconfiguring an instance never changes its identity.
 */
export interface DashboardWidgetInstance {
  key: string;
  definitionId: string;
  config?: WidgetConfig;
  hidden?: boolean;
}

/**
 * Props every Dashboard widget component receives. `instance` gives the widget
 * access to its stable key and its per-instance config.
 */
export interface WidgetComponentProps {
  instance: DashboardWidgetInstance;
}

/**
 * The code-defined catalog entry describing one kind of Dashboard widget.
 * Definitions are code, not database rows; the Dashboard widget is an instance
 * of a definition.
 */
export interface WidgetDefinition {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  /**
   * The area permission that gates the widget. Optional: a widget that derives
   * its availability from other sources (e.g. the metrics a user may read)
   * declares none and is always considered permitted.
   */
  permission?: string;
  size: WidgetSize;
  /** Which dashboard fascia the definition belongs to. Defaults to operational. */
  category?: WidgetCategory;
  component: ComponentType<WidgetComponentProps>;
  /** Optional config contract for configurable widgets. */
  configSchema?: unknown;
  defaultConfig?: WidgetConfig;
}

/** The persisted per-user document: the list of Dashboard widget instances. */
export type DashboardWidgets = DashboardWidgetInstance[];

/** One point of a Metric's time series: a bucket label and its value. */
export interface MetricPoint {
  label: string;
  value: number;
}

/**
 * A Metric's time series over the requested range: the buckets plus the current
 * total and its growth against the previous comparable period.
 */
export interface MetricSeries {
  points: MetricPoint[];
  total: number;
  percentageGrowth: number;
}

/**
 * A named, permission-scoped time series exposed by the server-side metric
 * registry. The Trend widget renders exactly one Metric at a time.
 */
export interface Metric {
  id: string;
  label: string;
  permission: string;
  timeSeries: (from: Date, to: Date) => Promise<MetricSeries>;
}

/** The client-facing summary of a Metric: enough to list and select it. */
export interface MetricSummary {
  id: string;
  label: string;
}
