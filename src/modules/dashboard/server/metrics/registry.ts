import "server-only";

import type { Metric } from "../../types";

import { contactsMetric } from "./contacts";
import { ebooksMetric } from "./ebooks";
import { revenueMetric } from "./revenue";
import { submissionsMetric } from "./submissions";

/**
 * The code-defined catalog of analytics Metrics. Adding a metric is one module
 * plus one entry here; the Trend widget supports it with no new UI.
 */
export const METRICS: Metric[] = [
  contactsMetric,
  submissionsMetric,
  ebooksMetric,
  revenueMetric,
];

/** The metric with the given id, or `undefined` when it is not registered. */
export const getMetric = (id: string): Metric | undefined =>
  METRICS.find((metric) => metric.id === id);

/**
 * The registered metrics the user is permitted to read. The Trend widget exposes
 * only these; when the result is empty the widget has nothing to render.
 */
export const permittedMetrics = (
  canRead: (permission: string) => boolean,
): Metric[] => METRICS.filter((metric) => canRead(metric.permission));
