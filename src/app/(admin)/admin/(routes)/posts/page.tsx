import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

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
  await requirePermission(PERMISSIONS.POSTS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchPosts(filters);

  return (
    <>
      <HydrateClient>
        <PostsListHeader />
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
