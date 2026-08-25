import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { loadSearchParams } from "@/modules/blog/posts/params";
import { prefetchPosts } from "@/modules/blog/posts/server/prefetch";

import {
  PostsListHeader,
  PostsView,
  PostsViewError,
  PostsViewLoading,
} from "@/modules/blog/posts";

interface Props {
  searchParams: Promise<SearchParams>;
}

const PostsPage = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchPosts(filters);

  return (
    <>
      <PostsListHeader />
      <HydrateClient>
        <Suspense fallback={<PostsViewLoading />}>
          <ErrorBoundary fallback={<PostsViewError />}>
            <PostsView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default PostsPage;
