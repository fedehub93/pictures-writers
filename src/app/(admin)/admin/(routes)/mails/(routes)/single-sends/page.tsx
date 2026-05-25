import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  SingleSendsView,
  SingleSendsViewError,
  SingleSendsViewLoading,
} from "@/modules/mails/single-sends/ui/views/single-sends-view";

import { prefetchSingleSends } from "@/modules/mails/single-sends/server/prefetch";

const EmailSingleSends = async () => {
  await requireAdminAuth();

  prefetchSingleSends();

  return (
    <HydrateClient>
      <Suspense fallback={<SingleSendsViewLoading />}>
        <ErrorBoundary fallback={<SingleSendsViewError />}>
          <SingleSendsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default EmailSingleSends;
