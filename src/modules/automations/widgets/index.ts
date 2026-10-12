import { TriangleAlert } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { FailedRunsWidget } from "./failed-runs-widget";

/**
 * The automations module's contribution to the dashboard catalog: the failed
 * runs widget, owned here because it reads AutomationRun data.
 */
export const automationsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "failed-runs",
    title: "Failed automations",
    description: "Automation runs that ended with an error.",
    icon: TriangleAlert,
    group: "automations",
    permission: PERMISSIONS.AUTOMATIONS_READ,
    defaultSize: "medium",
    component: FailedRunsWidget,
  },
];
