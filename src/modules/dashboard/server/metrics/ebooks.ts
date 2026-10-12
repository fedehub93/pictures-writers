import "server-only";

import { getEbookDownloadGrowth } from "@/data/email-contact";
import { PERMISSIONS } from "@/shared/lib/permissions";

import type { Metric } from "../../types";
import { seriesFromGrowthStats } from "./series";

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
