import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchPageById } from "@/modules/pages/server";

import {
  PageBuilderView,
  PageBuilderViewError,
  PageBuilderViewLoading,
} from "@/modules/pages";

const PageIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requireAdminAuth();

  const { rootId } = await params;
  prefetchPageById(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<PageBuilderViewLoading />}>
        <ErrorBoundary fallback={<PageBuilderViewError />}>
          <PageBuilderView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default PageIdPage;
