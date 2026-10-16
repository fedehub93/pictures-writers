import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import { buildRangeSeries, growthPercentage, monthlyBuckets } from "../series";

describe("monthlyBuckets", () => {
  it("returns one bucket per calendar month, oldest first", () => {
    const from = new Date(2026, 0, 15, 12);
    const to = new Date(2026, 2, 20, 12);

    const buckets = monthlyBuckets(from, to);

    expect(buckets).toHaveLength(3);
    expect(buckets.map((bucket) => bucket.label)).toEqual(
      [0, 1, 2].map((month) =>
        startOfMonth(new Date(2026, month, 1)).toLocaleString("default", {
          month: "long",
        }),
      ),
    );
  });

  it("clamps the first and last bucket to the requested range", () => {
    const from = new Date(2026, 0, 15, 12);
    const to = new Date(2026, 2, 20, 12);

    const buckets = monthlyBuckets(from, to);

    expect(buckets[0]?.start.toISOString()).toBe(
      startOfDay(from).toISOString(),
    );
    expect(buckets[0]?.end.toISOString()).toBe(
      endOfMonth(from).toISOString(),
    );
    expect(buckets[2]?.start.toISOString()).toBe(
      startOfDay(new Date(2026, 2, 1, 12)).toISOString(),
    );
    expect(buckets[2]?.end.toISOString()).toBe(endOfDay(to).toISOString());
  });

  it("returns a single bucket when the range falls in one month", () => {
    const buckets = monthlyBuckets(
      new Date(2026, 4, 3, 12),
      new Date(2026, 4, 28, 12),
    );

    expect(buckets).toHaveLength(1);
  });

  it("returns no bucket for an inverted range", () => {
    expect(
      monthlyBuckets(new Date(2026, 2, 1, 12), new Date(2026, 0, 1, 12)),
    ).toEqual([]);
  });

  it("adds the year to every label when the range spans a year boundary", () => {
    const buckets = monthlyBuckets(
      new Date(2025, 11, 5, 12),
      new Date(2026, 0, 20, 12),
    );

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      new Date(2025, 11, 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      new Date(2026, 0, 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    ]);
  });
});

describe("growthPercentage", () => {
  it("treats an empty previous period as 100% growth", () => {
    expect(growthPercentage(5, 0)).toBe(100);
  });

  it("rounds the percentage to two decimals", () => {
    expect(growthPercentage(3, 2)).toBe(50);
    expect(growthPercentage(1, 3)).toBe(-66.67);
  });
});

describe("buildRangeSeries", () => {
  it("buckets the range and weighs growth against the previous equal-length period", async () => {
    const from = new Date(2026, 0, 1, 0);
    const to = new Date(2026, 1, 28, 23);

    // A bucket call spans one month, the whole-range call spans two, and the
    // previous-period call spans the two months before the range.
    const aggregate = vi.fn(async (start: Date, end: Date): Promise<number> => {
      if (startOfMonth(start).getTime() === startOfMonth(end).getTime()) {
        return start.getMonth() === 0 ? 2 : 3;
      }
      return start.getMonth() === 0 ? 5 : 8;
    });

    const series = await buildRangeSeries(from, to, aggregate);

    expect(series.points).toEqual([
      { label: expect.any(String), value: 2 },
      { label: expect.any(String), value: 3 },
    ]);
    expect(series.total).toBe(5);
    expect(series.percentageGrowth).toBe(-37.5);

    // The comparable period is the two months immediately before the range
    // (shifted by the range's two months), not an overlapping one-month shift.
    expect(aggregate).toHaveBeenCalledWith(
      startOfDay(new Date(2025, 10, 1, 0)),
      endOfDay(new Date(2025, 11, 28, 0)),
    );
  });
});
