"use client";
import { DataPagination } from "@/shared/components/data-pagination";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspensePosts } from "../../../hooks/use-posts";
import { usePostsFilters } from "../../../hooks/use-posts-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreatePostDialog } from "../components/create-post-dialog";

export const PostsView = () => {
  const [filters, setFilters] = usePostsFilters();
  const { data } = useSuspensePosts(filters);
  return (
    <>
      <CreatePostDialog />
      <div className="px-6">
        <DataTable columns={columns} data={data.items} />
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
