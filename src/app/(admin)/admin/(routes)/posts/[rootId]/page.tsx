import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  PostIdView,
  PostIdViewError,
  PostIdViewLoading,
} from "@/modules/blog/posts";
import { prefetchPostById } from "@/modules/blog/posts/server/prefetch";

const PostIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requireAdminAuth();

  const { rootId } = await params;

  prefetchPostById(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<PostIdViewLoading />}>
        <ErrorBoundary fallback={<PostIdViewError />}>
          <PostIdView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default PostIdPage;
