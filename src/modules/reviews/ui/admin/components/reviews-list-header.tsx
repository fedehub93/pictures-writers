"use client";

import { ArrowDownIcon, PlusCircleIcon, XCircleIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../../constants";
import { useOpenReview } from "../../../hooks/use-open-review";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";

import { ReviewsSearchFilter } from "./reviews-search-filter";
import { ReviewsStatusFilter } from "./reviews-status-filter";
import { ReviewsProductFilter } from "./reviews-product-filter";

export const ReviewsListHeader = () => {
  const [filters, setFilters] = useReviewsFilters();
  const { onOpen } = useOpenReview();
  const canManage = usePermission(PERMISSIONS.REVIEWS_MANAGE);
  const trpc = useTRPC();

  const { data } = useQuery(trpc.reviews.getMany.queryOptions(filters));

  const isAnyFilterModified =
    !!filters.search || filters.status !== null || !!filters.product;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
      status: null,
      product: null,
    });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Reviews" totalEntries={data?.total ?? 0} />
      <div className="flex items-center justify-between gap-2">
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <ReviewsSearchFilter />
            <ReviewsStatusFilter />
            <ReviewsProductFilter />
            {isAnyFilterModified && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-8"
              >
                <XCircleIcon data-icon="inline-start" />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                Actions
                <ArrowDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen()}>
                <PlusCircleIcon />
                New review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
