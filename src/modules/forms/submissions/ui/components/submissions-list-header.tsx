"use client";

import { XCircleIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { useSubmissionsFilters } from "../../hooks/use-submissions-filters";
import { DEFAULT_PAGE } from "../../constants";

import { SubmissionsSearchFilter } from "./submissions-search-filters";
import { FormIdFilter } from "./form-id-filter";
import { useSuspenseFormSubmissions } from "../../hooks/use-submissions";

export const SubmissionsListHeader = () => {
  const [filters, setFilters] = useSubmissionsFilters();
  const { data } = useSuspenseFormSubmissions(filters);

  const isanyFilterModified = !!filters.search || !!filters.formId;

  const onClearFilters = () => {
    setFilters({
      search: "",
      formId: "",
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-4 px-6 pt-3">
        <ContentHeader label="Submissions" totalEntries={data.length} />
        <ScrollArea>
          <div className="flex items-center gap-x-2 px-1">
            <SubmissionsSearchFilter />
            <FormIdFilter />

            {isanyFilterModified && (
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
