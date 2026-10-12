import "server-only";

import { submissionsMetric } from "@/modules/forms/submissions/server/metrics";
import { contactsMetric, ebooksMetric } from "@/modules/mails/contacts/server/metrics";
import { revenueMetric } from "@/modules/shop/orders/server/metrics";
import type { Metric } from "@/shared/dashboard/types";

/**
 * The code-defined catalog of analytics Metrics, aggregated from the modules
 * that own each metric's data. The dashboard is the composition root: a domain
 * module registers its Metric and the Trend widget supports it with no new UI.
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
