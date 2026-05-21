"use client";

import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionStatsQuery } from "@/app/(admin)/_hooks/use-subscription-stats-query";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

export const SubscriptionsWidget = () => {
  const {
    data: subscriptionStats,
    isLoading,
    isError,
  } = useSubscriptionStatsQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !subscriptionStats) {
    return <div>Error fetching data.</div>;
  }

  const chartConfig = {
    download: {
      label: "Download",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card x-chunk="dashboard-01-chunk-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={subscriptionStats.chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              // content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="download" fill="var(--color-desktop)" radius={8} />
          </BarChart>
        </ChartContainer>
        <div className="text-2xl font-bold">
          <span className="mr-1">{subscriptionStats.currentMonthCount}</span>
          <span className="text-sm">({subscriptionStats.absoluteGrowth})</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {subscriptionStats.percentageGrowth}% from last month
        </p>
      </CardContent>
    </Card>
  );
};
