import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  TagIdView,
  TagIdViewError,
  TagIdViewLoading,
} from "@/modules/blog/tags";
import { prefetchTagById } from "@/modules/blog/tags/server/prefetch";

const TagIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requireAdminAuth();

  const { rootId } = await params;

  prefetchTagById(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<TagIdViewLoading />}>
        <ErrorBoundary fallback={<TagIdViewError />}>
          <TagIdView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default TagIdPage;
