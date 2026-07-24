"use client";

import { XCircleIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../constants";
import { usePagesFilters } from "../../hooks/use-pages-filters";

import { PagesSearchFilter } from "./pages-search-filters";
import { StatusFilter } from "./pages-status-filters";
import { useSuspensePages } from "../../hooks/use-pages";

export const PagesListHeader = () => {
  const [filters, setFilters] = usePagesFilters();
  const { data } = useSuspensePages(filters);

  const isAnyFilterModified = !!filters.search || !!filters.status;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
      status: null,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-4 px-6 pt-3">
        <ContentHeader label="Pages" totalEntries={data.length} />
        <ScrollArea>
          <div className="flex items-center gap-x-2 px-1">
            <PagesSearchFilter />
            <StatusFilter />
            {isAnyFilterModified && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <XCircleIcon />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
