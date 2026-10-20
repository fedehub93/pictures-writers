import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { ALL_AUDIENCES_ID } from "@/modules/mails/contacts/lib/constants";
import { prefetchContacts } from "@/modules/mails/contacts/server/prefetch";
import {
  ContactsView,
  ContactsViewError,
  ContactsViewLoading,
} from "@/modules/mails/contacts/ui/views/contacts-view";

export const metadata: Metadata = { title: "Contacts · Marketing" };

const AllContactsPage = async () => {
  await requireAdminAuth();

  // `ALL` makes `contacts.getMany` return every contact, regardless of audience.
  prefetchContacts({ audienceId: ALL_AUDIENCES_ID });

  return (
    <HydrateClient>
      <Suspense fallback={<ContactsViewLoading />}>
        <ErrorBoundary fallback={<ContactsViewError />}>
          <ContactsView audienceId={ALL_AUDIENCES_ID} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default AllContactsPage;
