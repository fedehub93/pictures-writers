import { db } from "@/lib/db";
import { EmailSettingsForm } from "./_components/email-settings-form";
import { EmailTesterForm } from "./_components/email-tester-form";

const MailSettings = async () => {
  const settings = await db.emailSetting.findFirst();

  const templates = await db.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Mail Settings</h1>
        </div>
      </div>
      <EmailSettingsForm settings={settings} />
      <EmailTesterForm templates={templates} />
    </div>
  );
};

export default MailSettings;
