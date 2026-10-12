import "server-only";

import {
  addMonths,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

import type { MetricPoint, MetricSeries } from "../types";

/** One calendar-month bucket of a Metric series, clamped to the range. */
export interface MonthBucket {
  label: string;
  start: Date;
  end: Date;
}

/** The aggregation a Metric runs over each bucket, the range, and its previous period. */
export type RangeAggregate = (start: Date, end: Date) => Promise<number>;

/**
 * The calendar months spanning the inclusive range, oldest first. The first and
 * last buckets are clamped to the range so the buckets always partition it
 * exactly (no bucket reaches outside the requested period).
 */
export const monthlyBuckets = (from: Date, to: Date): MonthBucket[] => {
  const rangeStart = startOfDay(from);
  const rangeEnd = endOfDay(to);

  const monthStarts: Date[] = [];
  for (
    let cursor = startOfMonth(rangeStart);
    cursor <= rangeEnd;
    cursor = addMonths(cursor, 1)
  ) {
    monthStarts.push(cursor);
  }

  // A range that crosses a year boundary would otherwise repeat month names, so
  // the year is added to every label of such a series.
  const spansYears =
    monthStarts.length > 1 &&
    monthStarts[0]!.getFullYear() !== monthStarts[monthStarts.length - 1]!.getFullYear();
  const labelFormat: Intl.DateTimeFormatOptions = spansYears
    ? { month: "long", year: "numeric" }
    : { month: "long" };

  return monthStarts.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);

    return {
      label: monthStart.toLocaleString("default", labelFormat),
      start: monthStart < rangeStart ? rangeStart : monthStart,
      end: monthEnd > rangeEnd ? rangeEnd : monthEnd,
    };
  });
};

/**
 * Growth of a current value against the previous comparable period, as a
 * percentage rounded to two decimals. An empty previous period reads as 100%
 * growth, matching the existing contact and ebook stats convention.
 */
export const growthPercentage = (current: number, previous: number): number =>
  previous === 0
    ? 100
    : Math.round(((current - previous) / previous) * 10000) / 100;

/**
 * Builds a Metric time series over the requested range: one point per calendar
 * month, the total over the whole range, and growth against the previous
 * comparable period (the same range shifted back one month). The aggregation is
 * injected so each metric decides what it counts or sums, and the helper is
 * unit testable without a database.
 */
export const buildRangeSeries = async (
  from: Date,
  to: Date,
  aggregate: RangeAggregate,
): Promise<MetricSeries> => {
  const buckets = monthlyBuckets(from, to);
  const points: MetricPoint[] = [];

  for (const bucket of buckets) {
    points.push({
      label: bucket.label,
      value: await aggregate(bucket.start, bucket.end),
    });
  }

  const [total, previousTotal] = await Promise.all([
    aggregate(startOfDay(from), endOfDay(to)),
    aggregate(startOfDay(subMonths(from, 1)), endOfDay(subMonths(to, 1))),
  ]);

  return {
    points,
    total,
    percentageGrowth: growthPercentage(total, previousTotal),
  };
};

/**
 * The shape of the existing contact/ebook growth stats: a fixed-window chart
 * plus the range total and its growth. Both the contacts and the ebook metric
 * wrap a query in this shape, so the mapping to a MetricSeries lives here once.
 */
export interface GrowthStatsLike {
  currentMonthCount: number;
  percentageGrowth: number;
  chartData?: { month: string; download: number }[] | null;
}

/** Maps wrapped growth stats onto a Metric series. */
export const seriesFromGrowthStats = (stats: GrowthStatsLike): MetricSeries => ({
  points: (stats.chartData ?? []).map(({ month, download }) => ({
    label: month,
    value: download,
  })),
  total: stats.currentMonthCount,
  percentageGrowth: stats.percentageGrowth,
});
