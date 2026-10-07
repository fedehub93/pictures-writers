"use client";

import { type SetStateAction } from "react";
import { type SortingState } from "@tanstack/react-table";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { DataPagination } from "@/shared/components/data-pagination";

import { useTagsFilters } from "../../hooks/use-tags-filters";
import { useSuspenseTags } from "../../hooks/use-tags";
import { DEFAULT_PAGE, TAG_LIST_SORTS } from "../../constants";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateTagDialog } from "../components/create-tag-dialog";

export const TagsView = () => {
  const [filters, setFilters] = useTagsFilters();
  const { data } = useSuspenseTags(filters);

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.direction === "desc" }]
    : [];

  const onSortingChange = (updater: SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    setFilters({
      sort: sort ? (sort.id as (typeof TAG_LIST_SORTS)[number]) : null,
      direction: sort ? (sort.desc ? "desc" : "asc") : null,
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <CreateTagDialog />
      <div className="px-6">
        <DataTable
          columns={columns}
          data={data.items}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      </div>
    </>
  );
};

export const TagsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Tags"
      description="This may take a few seconds"
    />
  );
};

export const TagsViewError = () => {
  return <ErrorState title="Error Tags" description="Something went wrong" />;
};
