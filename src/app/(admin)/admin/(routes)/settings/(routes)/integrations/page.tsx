import { Suspense } from "react";

import {
  IntegrationsView,
  IntegrationsViewLoading,
} from "@/modules/integrations/ui/views/integrations-view";

const IntegrationsSettingsPage = () => {
  return (
    <div className="p-4 w-full rounded-md flex flex-col gap-y-8">
      <Suspense fallback={<IntegrationsViewLoading />}>
        <IntegrationsView />
      </Suspense>
    </div>
  );
};

export default IntegrationsSettingsPage;
