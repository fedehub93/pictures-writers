import { getSettings } from "@/data/settings";
import { GlobalSettingsForm } from "./_components/global-settings-form";

const GlobalSettings = async () => {
  const settings = await getSettings();

  return (
    <div className="w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto pb-8">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>
      <GlobalSettingsForm settings={settings} />
    </div>
  );
};

export default GlobalSettings;
