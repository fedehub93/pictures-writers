"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import {
  defaultDateRange,
  useDateRangeStore,
} from "@/shared/hooks/use-date-range-store";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import { Skeleton } from "@/shared/ui/skeleton";

import { configStringValues } from "@/shared/dashboard/config";
import { resolveMetric } from "../../lib/metric-selection";
import type { WidgetComponentProps, WidgetConfig } from "@/shared/dashboard/types";
import { WidgetEmpty } from "@/shared/dashboard/ui/widget-states";

/** The config key the Trend's form picker writes to. */
const FORMS_FIELD = "forms";

/**
 * The instance's selected forms, for the form-submissions metric. Absent or
 * empty means "every form", so the metric's own unfiltered default applies.
 */
const resolveFormIds = (
  config: WidgetConfig | undefined,
): string[] | undefined => {
  const formIds = configStringValues(config, FORMS_FIELD);

  return formIds.length > 0 ? formIds : undefined;
};

/**
 * The generic analytics widget: renders exactly one Metric. It exposes only the
 * metrics the user may read and hides itself when there is none.
 */
export const TrendWidget = ({ instance }: WidgetComponentProps) => {
  const trpc = useTRPC();
  const { data: metrics } = useSuspenseQuery(
    trpc.dashboard.getMetrics.queryOptions(),
  );

  const metric = resolveMetric(instance.config, metrics);

  if (!metric) return null;

  return (
    <TrendChart
      metricId={metric.id}
      metricLabel={metric.label}
      formIds={resolveFormIds(instance.config)}
    />
  );
};

interface TrendChartProps {
  metricId: string;
  metricLabel: string;
  formIds?: string[];
}

const TrendChart = ({ metricId, metricLabel, formIds }: TrendChartProps) => {
  const trpc = useTRPC();
  const { dateRange } = useDateRangeStore();

  const fallback = defaultDateRange();
  const from = new Date(
    dateRange?.from ?? fallback.from ?? new Date(),
  ).toISOString();
  const to = new Date(
    dateRange?.to ?? fallback.to ?? new Date(),
  ).toISOString();

  const { data: series } = useSuspenseQuery(
    trpc.dashboard.getMetricSeries.queryOptions({
      metricId,
      from,
      to,
      formIds,
    }),
  );

  if (series.points.length === 0) {
    return <WidgetEmpty message="No data in this period." />;
  }

  const chartConfig = {
    value: {
      label: metricLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ChartContainer config={chartConfig} className="aspect-auto min-h-0 flex-1">
        <BarChart accessibilityLayer data={series.points}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => value.slice(0, 3)}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={8} />
        </BarChart>
      </ChartContainer>

      <div className="text-2xl font-bold">{series.total}</div>
      <p className="text-xs text-muted-foreground">
        {series.percentageGrowth}% vs the previous period
      </p>
    </div>
  );
};

/**
 * Fixed, varied bar heights for the loading chart. Deterministic on purpose: a
 * random layout would differ between the server and the first client render.
 */
const SKELETON_BARS = [42, 66, 50, 78, 58, 88, 70, 52, 74, 46, 82, 62];

/**
 * The loading body of the Trend widget: a stand-in bar chart, so the card shows
 * the chart's shape rather than a spinner while the metric loads.
 */
export const TrendWidgetSkeleton = () => (
  <div
    className="flex h-full min-h-0 flex-col gap-3"
    role="status"
    aria-label="Loading"
  >
    <div className="flex min-h-0 flex-1 items-end gap-2">
      {SKELETON_BARS.map((height, index) => (
        <Skeleton
          key={index}
          className="flex-1"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
    <Skeleton className="h-8 w-12" />
    <Skeleton className="h-3 w-40" />
  </div>
);
