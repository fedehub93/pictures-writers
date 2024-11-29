import { getSettings } from "@/data/settings";
import { Separator } from "@/components/ui/separator";
import { SidebarMenu } from "./_components/sidebar-menu";
import { SettingsProvider } from "./_components/providers/settings-provider";

const GlobalSettings = async ({ children }: { children: React.ReactNode }) => {
  const settings = await getSettings();

  return (
    <SettingsProvider settings={settings}>
      <div className="w-full flex flex-col gap-y-4 px-6 py-3 pb-8">
        <div className="w-full h-12 flex items-center justify-between gap-x-2">
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-bold space-y-0.5">Settings</h1>
            <p className="text-muted-foreground">
              Manage application settings.
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <SidebarMenu />
          {/* <GlobalSettingsForm settings={settings} /> */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </SettingsProvider>
  );
};

export default GlobalSettings;
