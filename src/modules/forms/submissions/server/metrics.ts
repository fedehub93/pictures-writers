import "server-only";

import { buildRangeSeries } from "@/shared/dashboard/metrics/series";
import type { Metric } from "@/shared/dashboard/types";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

/**
 * Form submissions: counts `FormSubmission` rows, bucketed by calendar month
 * over the requested range, gated by the submissions area permission. The
 * optional `params.formIds` narrows the count to the selected forms; when it is
 * absent or empty every form is counted, so an unconfigured Trend keeps showing
 * the site-wide total.
 */
export const submissionsMetric: Metric = {
  id: "submissions",
  label: "Form submissions",
  permission: PERMISSIONS.SUBMISSIONS_READ,
  timeSeries: (from, to, params) =>
    buildRangeSeries(from, to, (start, end) =>
      db.formSubmission.count({
        where: {
          createdAt: { gte: start, lte: end },
          ...(params?.formIds?.length ? { formId: { in: params.formIds } } : {}),
        },
      }),
    ),
};
