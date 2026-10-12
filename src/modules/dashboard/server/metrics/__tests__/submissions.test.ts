import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { submissionsMetric } from "../submissions";

const formIds: string[] = [];
const submissionIds: string[] = [];

/** An anchor far outside any other suite's data, so the global counts stay deterministic. */
const anchor = new Date(2099, 0, 15, 12);

/** A local-time instant within the month `monthsAgo` before the anchor. */
const monthDate = (monthsAgo: number, day = 10) => {
  const base = subMonths(anchor, monthsAgo);
  return new Date(base.getFullYear(), base.getMonth(), day, 12);
};

async function createForm() {
  const form = await db.form.create({ data: { name: `Form ${randomUUID()}` } });
  formIds.push(form.id);
  return form;
}

async function createSubmission(formId: string, createdAt: Date) {
  const submission = await db.formSubmission.create({
    data: { formId, data: {}, createdAt },
  });
  submissionIds.push(submission.id);
  return submission;
}

beforeEach(() => {
  formIds.length = 0;
  submissionIds.length = 0;
});

afterEach(async () => {
  if (submissionIds.length > 0) {
    await db.formSubmission.deleteMany({ where: { id: { in: submissionIds } } });
  }
  if (formIds.length > 0) {
    await db.form.deleteMany({ where: { id: { in: formIds } } });
  }
  formIds.length = 0;
  submissionIds.length = 0;
});

describe("submissions metric", () => {
  it("is gated by the submissions area permission", () => {
    expect(submissionsMetric.permission).toBe(PERMISSIONS.SUBMISSIONS_READ);
  });

  it("buckets submissions by calendar month over the range", async () => {
    const form = await createForm();
    await createSubmission(form.id, monthDate(1));
    await createSubmission(form.id, monthDate(0));
    await createSubmission(form.id, monthDate(0));

    const series = await submissionsMetric.timeSeries(
      startOfMonth(subMonths(anchor, 1)),
      endOfMonth(anchor),
    );

    expect(series.points).toHaveLength(2);
    expect(series.points.map((point) => point.value)).toEqual([1, 2]);
    expect(series.total).toBe(3);
  });

  it("reports growth against the previous comparable period", async () => {
    const form = await createForm();
    await createSubmission(form.id, monthDate(1));
    await createSubmission(form.id, monthDate(0));
    await createSubmission(form.id, monthDate(0));

    const series = await submissionsMetric.timeSeries(
      startOfMonth(anchor),
      endOfMonth(anchor),
    );

    expect(series.total).toBe(2);
    expect(series.percentageGrowth).toBe(100);
  });
});
