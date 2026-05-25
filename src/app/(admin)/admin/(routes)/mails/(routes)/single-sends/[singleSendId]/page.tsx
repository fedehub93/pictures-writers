import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { prefetchSingleSendById } from "@/modules/mails/single-sends/server/prefetch";
import {
  SingleSendIdView,
  SingleSendViewError,
  SingleSendViewLoading,
} from "@/modules/mails/single-sends/ui/views/single-send-id-view";

const SingleSendIdPage = async ({
  params,
}: {
  params: Promise<{ singleSendId: string }>;
}) => {
  const { singleSendId } = await params;
  prefetchSingleSendById(singleSendId);

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
