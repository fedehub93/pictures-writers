"use client";

import { type SetStateAction } from "react";
import { type SortingState } from "@tanstack/react-table";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspensePosts } from "../../../hooks/use-posts";
import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { DEFAULT_PAGE, POST_LIST_SORTS } from "../../../constants";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreatePostDialog } from "../components/create-post-dialog";

export const PostsView = () => {
  const [filters, setFilters] = usePostsFilters();
  const { data } = useSuspensePosts(filters);

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.direction === "desc" }]
    : [];

  const onSortingChange = (updater: SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    setFilters({
      sort: sort ? (sort.id as (typeof POST_LIST_SORTS)[number]) : null,
      direction: sort ? (sort.desc ? "desc" : "asc") : null,
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <CreatePostDialog />
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

export const PostsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Posts"
      description="This may take a few seconds"
    />
  );
};

export const PostsViewError = () => {
  return <ErrorState title="Error Posts" description="Something went wrong" />;
};
