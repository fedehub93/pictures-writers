"use client";

import { StarIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@/shared/ui/badge";

import { WidgetList } from "../components/widget-list";

export const PendingReviewsWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.dashboard.getPendingReviews.queryOptions(),
  );

  return (
    <WidgetList
      count={data.count}
      isEmpty={data.items.length === 0}
      emptyMessage="No reviews to moderate."
      href="/admin/shop/reviews?status=false"
      linkLabel="Moderate reviews"
    >
      {data.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">
              {item.reviewerName || "Anonymous"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {item.productTitle || "Product"}
            </span>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1 [&_svg]:size-3">
            <StarIcon className="fill-current" />
            {item.rating.toLocaleString("it-IT")}
          </Badge>
        </li>
      ))}
    </WidgetList>
  );
};
