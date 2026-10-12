import "server-only";

import { getEbookDownloadGrowth } from "@/data/email-contact";
import { seriesFromGrowthStats } from "@/shared/dashboard/metrics/series";
import type { Metric } from "@/shared/dashboard/types";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { getEmailContactsGrowth } from "./data";

/**
 * Contacts: reuses the existing contact growth query. The growth total and
 * percentage come from the selected range; the buckets are the trailing six
 * months that query already produces.
 */
export const contactsMetric: Metric = {
  id: "contacts",
  label: "Contacts",
  permission: PERMISSIONS.CONTACTS_READ,
  timeSeries: async (from, to) => {
    const stats = await getEmailContactsGrowth(from, to);

    return seriesFromGrowthStats(stats);
  },
};

/**
 * Ebook downloads: wraps the existing ebook download stats (folding the former
 * `/api/ebooks/stats` REST logic into the metric registry). The range drives the
 * total and growth; the buckets are the trailing six months that query already
 * produces. Gated by `dashboard.read`, as the REST endpoint was.
 */
export const ebooksMetric: Metric = {
  id: "ebooks",
  label: "Ebook downloads",
  permission: PERMISSIONS.DASHBOARD_READ,
  timeSeries: async (from, to) => {
    const stats = await getEbookDownloadGrowth(from, to);

    return seriesFromGrowthStats(stats);
  },
};
