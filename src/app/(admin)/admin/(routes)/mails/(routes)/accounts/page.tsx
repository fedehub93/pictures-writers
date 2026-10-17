import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchEmailAccounts } from "@/modules/mails/accounts/server/prefetch";
import {
  EmailAccountsView,
  EmailAccountsViewError,
  EmailAccountsViewLoading,
} from "@/modules/mails/accounts/ui/views/accounts-view";

const EmailAccountsPage = async () => {
  await requireAdminAuth();

  prefetchEmailAccounts();

  return (
    <HydrateClient>
      <Suspense fallback={<EmailAccountsViewLoading />}>
        <ErrorBoundary fallback={<EmailAccountsViewError />}>
          <EmailAccountsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default EmailAccountsPage;
