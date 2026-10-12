import { CalendarClock } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { ScheduledWidget } from "./scheduled-widget";

/**
 * The scheduler module's contribution to the dashboard catalog: the scheduled
 * content widget, owned here because it reads ScheduledAction rows.
 */
export const schedulerDashboardWidgets: WidgetDefinition[] = [
  {
    id: "scheduled",
    title: "Scheduled content",
    description: "Content with a planned publication in the future.",
    icon: CalendarClock,
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "medium",
    component: ScheduledWidget,
  },
];
