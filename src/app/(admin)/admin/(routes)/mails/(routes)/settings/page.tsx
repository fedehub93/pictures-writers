import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchMailSettings } from "@/modules/mails/settings/server/prefetch";
import {
  SettingsView,
  SettingsViewError,
  SettingsViewLoading,
} from "@/modules/mails/settings/ui/views/settings-view";

const MailSettings = async () => {
  await requireAdminAuth();

  prefetchMailSettings();

  return (
    <HydrateClient>
      <Suspense fallback={<SettingsViewLoading />}>
        <ErrorBoundary fallback={<SettingsViewError />}>
          <SettingsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default MailSettings;
