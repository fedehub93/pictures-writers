import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import { buildRangeSeries, growthPercentage, monthlyBuckets, seriesFromGrowthStats } from "../series";

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
  it("buckets the range by month and totals it with growth from the previous period", async () => {
    const from = new Date(2026, 0, 1, 0);
    const to = new Date(2026, 1, 28, 23);

    // Two monthly buckets (Jan, Feb), the whole range total (Jan–Feb), and the
    // previous comparable period (Dec–Jan).
    const aggregate = vi.fn(async (start: Date, end: Date): Promise<number> => {
      if (start.getMonth() === 11) return 4;
      if (start.getMonth() === end.getMonth()) {
        return start.getMonth() === 0 ? 2 : 3;
      }
      return 5;
    });

    const series = await buildRangeSeries(from, to, aggregate);

    expect(series.points).toEqual([
      { label: expect.any(String), value: 2 },
      { label: expect.any(String), value: 3 },
    ]);
    expect(series.total).toBe(5);
    expect(series.percentageGrowth).toBe(25);
  });
});

describe("seriesFromGrowthStats", () => {
  it("maps wrapped growth stats onto a metric series", () => {
    const series = seriesFromGrowthStats({
      currentMonthCount: 7,
      percentageGrowth: 25,
      chartData: [
        { month: "January", download: 2 },
        { month: "February", download: 5 },
      ],
    });

    expect(series).toEqual({
      points: [
        { label: "January", value: 2 },
        { label: "February", value: 5 },
      ],
      total: 7,
      percentageGrowth: 25,
    });
  });

  it("tolerates missing chart data", () => {
    const series = seriesFromGrowthStats({
      currentMonthCount: 0,
      percentageGrowth: 100,
    });

    expect(series.points).toEqual([]);
  });
});
