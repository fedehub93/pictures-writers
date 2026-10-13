import { CalendarClock } from "lucide-react";

import { ScheduledActionType } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";
import type {
  WidgetConfigOption,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { ScheduledWidget, ScheduledWidgetSkeleton } from "./scheduled-widget";

const TYPE_OPTIONS: WidgetConfigOption[] = [
  { value: ScheduledActionType.PUBLISH_POST, label: "Posts" },
  { value: ScheduledActionType.SEND_EMAIL, label: "Newsletters" },
];

const DEFAULT_TYPES = [
  ScheduledActionType.PUBLISH_POST,
  ScheduledActionType.SEND_EMAIL,
];

/**
 * The scheduler module's contribution to the dashboard catalog: the scheduled
 * content widget, owned here because it reads ScheduledAction rows. Its config
 * lets a card narrow the list to one action type.
 */
export const schedulerDashboardWidgets: WidgetDefinition[] = [
  {
    id: "scheduled",
    title: "Scheduled Content",
    description: "Content planned to go out in the future.",
    icon: CalendarClock,
    group: "content",
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "full",
    component: ScheduledWidget,
    loadingFallback: ScheduledWidgetSkeleton,
    configSchema: () => ({
      fields: [
        {
          type: "multiselect",
          name: "types",
          label: "Types",
          options: TYPE_OPTIONS,
        },
      ],
    }),
    defaultConfig: {
      types: DEFAULT_TYPES,
    },
  },
];
