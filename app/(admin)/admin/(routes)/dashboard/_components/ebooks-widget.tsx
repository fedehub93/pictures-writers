"use client";

import { Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEbookStatsQuery } from "@/app/(admin)/_hooks/use-ebook-stats-query";

export const EbooksWidget = () => {
  const {
    data: ebookDownloadedStats,
    isLoading,
    isError,
  } = useEbookStatsQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !ebookDownloadedStats) {
    return <div>Error fetching data.</div>;
  }

  return (
    <Card x-chunk="dashboard-01-chunk-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Ebook Downloaded</CardTitle>
        <Download className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <span className="mr-1">{ebookDownloadedStats.currentMonthCount}</span>
          <span className="text-sm">
            ({ebookDownloadedStats.absoluteGrowth})
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {ebookDownloadedStats.percentageGrowth}% from last month
        </p>
      </CardContent>
    </Card>
  );
};
