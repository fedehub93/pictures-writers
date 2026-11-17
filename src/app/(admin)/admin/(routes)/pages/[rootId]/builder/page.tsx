import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";
import { getSettings } from "@/data/settings";

import { prefetchPageById } from "@/modules/pages/server";
import { getSiteLayoutPreview } from "@/modules/site-regions/server/queries";

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
  const session = await requireAdminAuth();

  const { rootId } = await params;
  prefetchPageById(rootId);

  // Read the regions once, when the builder opens: the Site layout preview is
  // a snapshot of the layout, not a live subscription. The user id decides
  // whether a draft region may be shown.
  const [siteLayout, settings] = await Promise.all([
    getSiteLayoutPreview({ userId: session.id }),
    getSettings(),
  ]);

  return (
    <HydrateClient>
      <Suspense fallback={<PageBuilderViewLoading />}>
        <ErrorBoundary fallback={<PageBuilderViewError />}>
          <PageBuilderView
            rootId={rootId}
            siteLayout={siteLayout}
            metadata={{
              siteName: settings.siteName ?? undefined,
              logoUrl: settings.logoUrl ?? undefined,
            }}
          />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default PageIdPage;
