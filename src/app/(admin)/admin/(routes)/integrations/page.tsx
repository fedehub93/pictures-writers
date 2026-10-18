import { Suspense } from "react";

import {
  IntegrationsView,
  IntegrationsViewLoading,
} from "@/modules/integrations/ui/views/integrations-view";

const IntegrationsPage = () => {
  return (
    <Suspense fallback={<IntegrationsViewLoading />}>
      <IntegrationsView />
    </Suspense>
  );
};

export default IntegrationsPage;
