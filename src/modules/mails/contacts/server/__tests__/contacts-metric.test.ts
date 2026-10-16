import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import { contactsMetric } from "../metrics";

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
  it("buckets contacts by calendar month over the range", async () => {
    await createContact(new Date(2099, 3, 10, 12)); // April
    await createContact(new Date(2099, 4, 10, 12)); // May
    await createContact(new Date(2099, 4, 20, 12)); // May

    const series = await contactsMetric.timeSeries(
      startOfMonth(new Date(2099, 3, 1)),
      endOfMonth(new Date(2099, 5, 1)),
    );

    expect(series.points).toHaveLength(3);
    expect(series.points.map((point) => point.value)).toEqual([1, 2, 0]);
    expect(series.total).toBe(3);
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
