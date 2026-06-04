import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { getEmailsSentToday } from "@/modules/mails/lib/mail";

import { EmailSettingsForm } from "./_components/email-settings-form";
import { EmailTesterForm } from "./_components/email-tester-form";
import { EmailSubscriptionForm } from "./_components/email-subscription-form";
import { prefetchMailSettings } from "@/modules/mails/settings/server/prefetch";
import {
  SettingsView,
  SettingsViewError,
  SettingsViewLoading,
} from "@/modules/mails/settings/ui/views/settings-view";

const MailSettings = async () => {
  await requireAdminAuth();

  prefetchMailSettings();

  // const settings = await db.emailSetting.findFirst();

  // const templates = await db.emailTemplate.findMany({
  //   orderBy: { name: "asc" },
  // });

  // const emailsSentToday = await getEmailsSentToday();

  return (
    <HydrateClient>
      <Suspense fallback={<SettingsViewLoading />}>
        <ErrorBoundary fallback={<SettingsViewError />}>
          <SettingsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
  // return (
  //   <div className="w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto overflow-y-auto">
  //     <div className="w-full h-12 flex items-center justify-between gap-x-2">
  //       <div className="flex flex-col flex-1">
  //         <h1 className="text-2xl font-bold">Mail Settings</h1>
  //       </div>
  //     </div>
  //     <EmailSettingsForm
  //       settings={settings}
  //       emailsSentToday={emailsSentToday}
  //     />
  //     <EmailSubscriptionForm settings={settings} templates={templates} />
  //     <EmailTesterForm templates={templates} />
  //   </div>
  // );
};

export default MailSettings;
