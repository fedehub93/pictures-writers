import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { getEmailsSentToday, getTodayEmailsAvailable } from "@/lib/mail";

import { EmailSettingsForm } from "./_components/email-settings-form";
import { EmailTesterForm } from "./_components/email-tester-form";
import { EmailSubscriptionForm } from "./_components/email-subscription-form";

const MailSettings = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const settings = await db.emailSetting.findFirst();

  const templates = await db.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  const emailsSentToday = await getEmailsSentToday();

  return (
    <div className="w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto overflow-y-auto">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Mail Settings</h1>
        </div>
      </div>
      <EmailSettingsForm
        settings={settings}
        emailsSentToday={emailsSentToday}
      />
      <EmailSubscriptionForm settings={settings} templates={templates} />
      <EmailTesterForm templates={templates} />
    </div>
  );
};

export default MailSettings;
