import "server-only";

import { getEmailContactsGrowth } from "@/modules/mails/contacts/server/data";
import { PERMISSIONS } from "@/shared/lib/permissions";

import type { Metric, MetricPoint } from "../../types";

/** The shape of the buckets the existing contact growth query returns. */
interface ContactGrowthBucket {
  month: string;
  download: number;
}

/**
 * Iscritti / contatti: reuses the existing contact growth query. The growth
 * total and percentage come from the selected range; the buckets are the
 * trailing six months that query already produces.
 */
export const contactsMetric: Metric = {
  id: "contacts",
  label: "Iscritti / contatti",
  permission: PERMISSIONS.CONTACTS_READ,
  timeSeries: async (from, to) => {
    const stats = await getEmailContactsGrowth(from, to);
    const buckets = (stats.chartData ?? []) as ContactGrowthBucket[];

    const points: MetricPoint[] = buckets.map(({ month, download }) => ({
      label: month,
      value: download,
    }));

    return {
      points,
      total: stats.currentMonthCount,
      percentageGrowth: stats.percentageGrowth,
    };
  },
};
