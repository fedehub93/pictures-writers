import { TriangleAlert } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import {
  FailedRunsWidget,
  FailedRunsWidgetSkeleton,
} from "./failed-runs-widget";

/**
 * The automations module's contribution to the dashboard catalog: the failed
 * runs widget, owned here because it reads AutomationRun data.
 */
export const automationsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "failed-runs",
    title: "Automation Runs",
    description: "Automation runs that ended with an error.",
    icon: TriangleAlert,
    group: "automations",
    permission: PERMISSIONS.AUTOMATIONS_READ,
    defaultSize: "medium",
    // Room for the headline count, a couple of rows, and the footer link.
    minGrid: { w: 3, h: 3 },
    component: FailedRunsWidget,
    loadingFallback: FailedRunsWidgetSkeleton,
  },
];
