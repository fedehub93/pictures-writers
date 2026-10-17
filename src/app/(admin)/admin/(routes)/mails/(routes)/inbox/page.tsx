import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchAllowedEmailAccounts } from "@/modules/mails/accounts/server/prefetch";
import {
  ConversationsView,
  ConversationsViewError,
  ConversationsViewLoading,
} from "@/modules/mails/conversations/ui/views/conversations-view";

const ConversationsInboxPage = async () => {
  await requireAdminAuth();

  prefetchAllowedEmailAccounts();

  return (
    <HydrateClient>
      <Suspense fallback={<ConversationsViewLoading />}>
        <ErrorBoundary fallback={<ConversationsViewError />}>
          <ConversationsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ConversationsInboxPage;
