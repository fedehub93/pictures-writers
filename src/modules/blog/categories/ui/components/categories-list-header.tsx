"use client";

import { ArrowDownIcon, PlusCircleIcon, XCircleIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../constants";

import { StatusFilter } from "./categories-status-filter";
import { useCategoriesFilters } from "../../hooks/use-categories-filters";
import { useOpenCategory } from "../../hooks/use-open-category";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export const CategoriesListHeader = () => {
  const [filters, setFilters] = useCategoriesFilters();
  const { onOpen } = useOpenCategory();

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
        <ContentHeader label="Categories" totalEntries={0} />
        <div className="flex justify-between">
          <ScrollArea>
            <div className="flex items-center gap-x-2 px-1 py-4">
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
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  Actions
                  <ArrowDownIcon className="size-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen()}>
                  <PlusCircleIcon className="size-4 mr-2" />
                  New Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};
