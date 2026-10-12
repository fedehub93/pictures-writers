import "server-only";

import { getEmailContactsGrowth } from "@/modules/mails/contacts/server/data";
import { PERMISSIONS } from "@/shared/lib/permissions";

import type { Metric } from "../../types";
import { seriesFromGrowthStats } from "./series";

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

    return seriesFromGrowthStats(stats);
  },
};
