import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { prefetchSingleSendById } from "@/modules/mails/single-sends/server/prefetch";
import {
  SingleSendIdView,
  SingleSendViewError,
  SingleSendViewLoading,
} from "@/modules/mails/single-sends/ui/views/single-send-id-view";
import { prefetchAudiences } from "@/modules/mails/audiences/server/prefetch";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

const SingleSendIdPage = async ({
  params,
}: {
  params: Promise<{ singleSendId: string }>;
}) => {
  await requireAdminAuth();

  const { singleSendId } = await params;

  prefetchSingleSendById(singleSendId);
  prefetchAudiences();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<SingleSendViewError />}>
        <Suspense fallback={<SingleSendViewLoading />}>
          <SingleSendIdView singleSendId={singleSendId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default SingleSendIdPage;
