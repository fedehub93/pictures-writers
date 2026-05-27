import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchAudiences } from "@/modules/mails/audiences/server/prefetch";
import {
  AudiencesView,
  AudiencesViewError,
  AudiencesViewLoading,
} from "@/modules/mails/audiences/ui/views/audiences-view";

const ContactsPage = async () => {
  await requireAdminAuth();

  prefetchAudiences();

  return (
    <HydrateClient>
      <Suspense fallback={<AudiencesViewLoading />}>
        <ErrorBoundary fallback={<AudiencesViewError />}>
          <AudiencesView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ContactsPage;
