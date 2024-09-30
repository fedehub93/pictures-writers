import { SeoSettingsForm } from "./_components/seo-settings-form";
import { getSettings } from "@/data/settings";

const MailSettings = async () => {
  const { seo } = await getSettings();

  return (
    <div className="w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto pb-8">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">SEO</h1>
        </div>
      </div>
      <SeoSettingsForm seo={seo} />
    </div>
  );
};

export default MailSettings;
