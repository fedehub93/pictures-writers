"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspensePosts } from "../../../hooks/use-posts";
import { usePostsFilters } from "../../../hooks/use-posts-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreatePostDialog } from "../components/create-post-dialog";

export const PostsView = () => {
  const [filters, _] = usePostsFilters();
  const { data } = useSuspensePosts(filters);
  return (
    <>
      <CreatePostDialog />
      <div className="px-6">
        <DataTable columns={columns} data={data} />
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
