import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import { contactsMetric } from "../contacts";

const createdContactIds: string[] = [];

async function createContact(createdAt: Date) {
  const contact = await db.emailContact.create({
    data: { email: `metric-${randomUUID()}@example.com`, createdAt },
  });
  createdContactIds.push(contact.id);
  return contact;
}

beforeEach(async () => {
  // Other suites seed contacts at arbitrary dates; the bucket assertions need a
  // clean table to stay deterministic.
  await db.emailContact.deleteMany({});
});

afterEach(async () => {
  if (createdContactIds.length > 0) {
    await db.emailContact.deleteMany({
      where: { id: { in: createdContactIds } },
    });
    createdContactIds.length = 0;
  }
});

describe("contacts metric", () => {
  it("buckets contacts into the trailing six months by calendar month", async () => {
    const now = new Date();
    // Five months back lands in the second bucket (index 1); two months back
    // lands in the fifth (index 4). Buckets run from six months ago to last
    // month, so the current month is intentionally excluded.
    await createContact(subMonths(now, 5));
    await createContact(subMonths(now, 5));
    await createContact(subMonths(now, 2));

    const series = await contactsMetric.timeSeries(
      startOfMonth(now),
      endOfMonth(now),
    );

    expect(series.points).toHaveLength(6);
    expect(series.points[1]?.value).toBe(2);
    expect(series.points[4]?.value).toBe(1);
    expect(
      series.points.reduce((total, point) => total + point.value, 0),
    ).toBe(3);
  });

  it("reports the current total and its growth from the range", async () => {
    const now = new Date();
    const currentMonth = subMonths(now, 1);
    const previousMonth = subMonths(now, 2);

    await createContact(currentMonth);
    await createContact(currentMonth);
    await createContact(previousMonth);

    const series = await contactsMetric.timeSeries(
      startOfMonth(currentMonth),
      endOfMonth(currentMonth),
    );

    expect(series.total).toBe(2);
    expect(series.percentageGrowth).toBe(100);
  });
});
