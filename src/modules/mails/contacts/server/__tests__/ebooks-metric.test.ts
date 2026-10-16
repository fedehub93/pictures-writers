import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { ebooksMetric } from "../metrics";

const contactIds: string[] = [];

/** An anchor far outside any other suite's data, so the global counts stay deterministic. */
const anchor = new Date(2099, 0, 15, 12);

/** A local-time instant within the month `monthsAgo` before the anchor. */
const monthDate = (monthsAgo: number, day = 10) => {
  const base = subMonths(anchor, monthsAgo);
  return new Date(base.getFullYear(), base.getMonth(), day, 12);
};

async function createDownload(interactionDate: Date) {
  // Each contact can hold a single `ebook_downloaded` interaction, so a download
  // needs its own contact.
  const contact = await db.emailContact.create({
    data: { email: `ebook-${randomUUID()}@example.com` },
  });
  contactIds.push(contact.id);

  await db.emailContactInteraction.create({
    data: {
      contactId: contact.id,
      interactionType: "ebook_downloaded",
      interactionDate,
    },
  });
}

beforeEach(() => {
  contactIds.length = 0;
});

afterEach(async () => {
  if (contactIds.length > 0) {
    await db.emailContact.deleteMany({ where: { id: { in: contactIds } } });
  }
  contactIds.length = 0;
});

describe("download ebook metric", () => {
  it("is gated by dashboard.read, as the REST endpoint was", () => {
    expect(ebooksMetric.permission).toBe(PERMISSIONS.DASHBOARD_READ);
  });

  it("buckets downloads by calendar month over the range", async () => {
    await createDownload(monthDate(1));
    await createDownload(monthDate(0));
    await createDownload(monthDate(0));

    const series = await ebooksMetric.timeSeries(
      startOfMonth(subMonths(anchor, 1)),
      endOfMonth(anchor),
    );

    expect(series.points).toHaveLength(2);
    expect(series.points.map((point) => point.value)).toEqual([1, 2]);
    expect(series.total).toBe(3);
  });

  it("reports growth against the previous equal-length period", async () => {
    await createDownload(monthDate(0));
    await createDownload(monthDate(0));
    await createDownload(monthDate(1));

    const series = await ebooksMetric.timeSeries(
      startOfMonth(anchor),
      endOfMonth(anchor),
    );

    expect(series.total).toBe(2);
    expect(series.percentageGrowth).toBe(100);
  });
});
