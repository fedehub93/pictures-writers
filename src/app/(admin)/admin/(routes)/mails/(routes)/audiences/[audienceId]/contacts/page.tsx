import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchContacts } from "@/modules/mails/contacts/server/prefetch";

import {
  ContactsView,
  ContactsViewError,
  ContactsViewLoading,
} from "@/modules/mails/contacts/ui/views/contacts-view";

const AudienceIdContactsPage = async ({
  params,
}: {
  params: Promise<{ audienceId: string }>;
}) => {
  await requireAdminAuth();
  const { audienceId } = await params;

  prefetchContacts({ audienceId: audienceId });

  return (
    <HydrateClient>
      <Suspense fallback={<ContactsViewLoading />}>
        <ErrorBoundary fallback={<ContactsViewError />}>
          <ContactsView audienceId={audienceId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default AudienceIdContactsPage;
