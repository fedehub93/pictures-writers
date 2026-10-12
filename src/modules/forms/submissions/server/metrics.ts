import "server-only";

import { buildRangeSeries } from "@/shared/dashboard/metrics/series";
import type { Metric } from "@/shared/dashboard/types";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

/**
 * Form submissions: counts `FormSubmission` rows, bucketed by calendar month
 * over the requested range, gated by the submissions area permission.
 */
export const submissionsMetric: Metric = {
  id: "submissions",
  label: "Form submissions",
  permission: PERMISSIONS.SUBMISSIONS_READ,
  timeSeries: (from, to) =>
    buildRangeSeries(from, to, (start, end) =>
      db.formSubmission.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ),
};
