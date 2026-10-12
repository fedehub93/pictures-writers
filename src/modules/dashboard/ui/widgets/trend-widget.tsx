"use client";

import { endOfMonth, startOfMonth } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { useDateRangeStore } from "@/shared/hooks/use-date-range-store";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

import { resolveMetric } from "../../lib/metric-selection";
import type { WidgetComponentProps } from "../../types";

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

  return <TrendChart metricId={metric.id} metricLabel={metric.label} />;
};

interface TrendChartProps {
  metricId: string;
  metricLabel: string;
}

const TrendChart = ({ metricId, metricLabel }: TrendChartProps) => {
  const trpc = useTRPC();
  const { dateRange } = useDateRangeStore();

  const from = (
    dateRange?.from ? new Date(dateRange.from) : startOfMonth(new Date())
  ).toISOString();
  const to = (
    dateRange?.to ? new Date(dateRange.to) : endOfMonth(new Date())
  ).toISOString();

  const { data: series } = useSuspenseQuery(
    trpc.dashboard.getMetricSeries.queryOptions({ metricId, from, to }),
  );

  const chartConfig = {
    value: {
      label: metricLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex h-full flex-col gap-3">
      <ChartContainer config={chartConfig}>
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
        {series.percentageGrowth}% rispetto al periodo precedente
      </p>
    </div>
  );
};
