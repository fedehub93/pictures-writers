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
    // A table needs room for its header, a few rows, and the footer to stay
    // legible; below this the body scrolls instead of spilling out of the card.
    minGrid: { w: 6, h: 4 },
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
