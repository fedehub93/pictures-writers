import "server-only";

import { buildRangeSeries } from "@/shared/dashboard/metrics/series";
import type { Metric } from "@/shared/dashboard/types";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

/**
 * Contacts: counts `EmailContact` rows per calendar month over the requested
 * range, gated by the contacts area permission.
 */
export const contactsMetric: Metric = {
  id: "contacts",
  label: "Contacts",
  permission: PERMISSIONS.CONTACTS_READ,
  timeSeries: (from, to) =>
    buildRangeSeries(from, to, (start, end) =>
      db.emailContact.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ),
};

/**
 * Ebook downloads: counts `EmailContactInteraction` rows of type
 * `ebook_downloaded` per calendar month over the requested range. A contact
 * holds at most one such interaction (unique `[contactId, interactionType]`),
 * so the count is unique contacts that downloaded, not download events. Gated
 * by `dashboard.read`, as the former REST endpoint was.
 */
export const ebooksMetric: Metric = {
  id: "ebooks",
  label: "Ebook downloads",
  permission: PERMISSIONS.DASHBOARD_READ,
  timeSeries: (from, to) =>
    buildRangeSeries(from, to, (start, end) =>
      db.emailContactInteraction.count({
        where: {
          interactionType: "ebook_downloaded",
          interactionDate: { gte: start, lte: end },
        },
      }),
    ),
};
