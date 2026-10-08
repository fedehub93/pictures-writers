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
  params: Promise<{ id: string }>;
}) => {
  await requireAdminAuth();

  const { id } = await params;

  prefetchTagById(id);

  return (
    <HydrateClient>
      <Suspense fallback={<TagIdViewLoading />}>
        <ErrorBoundary fallback={<TagIdViewError />}>
          <TagIdView id={id} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default TagIdPage;
