import { FileText } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { summarizeMultiselect } from "@/shared/dashboard/config";
import type {
  WidgetConfigOption,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { DraftsWidget, DraftsWidgetSkeleton } from "./drafts-widget";

const STATUS_OPTIONS: WidgetConfigOption[] = [
  { value: ContentStatus.DRAFT, label: "Draft" },
  { value: ContentStatus.CHANGED, label: "Changed" },
  { value: ContentStatus.SCHEDULED, label: "Scheduled" },
  { value: ContentStatus.PUBLISHED, label: "Published" },
];

const DEFAULT_STATUSES = [ContentStatus.DRAFT, ContentStatus.CHANGED];

/**
 * The blog module's contribution to the dashboard catalog: the content widget,
 * owned here because it reads Post data and is gated by the posts permission.
 * It defaults to the posts awaiting publication — drafts and changed posts —
 * and its config widens the list to any set of statuses.
 */
export const postsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "drafts",
    title: "Latest Posts",
    description: "Posts, most recently updated first.",
    icon: FileText,
    group: "content",
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "full",
    component: DraftsWidget,
    loadingFallback: DraftsWidgetSkeleton,
    configSchema: () => ({
      fields: [
        {
          type: "multiselect",
          name: "statuses",
          label: "Statuses",
          options: STATUS_OPTIONS,
        },
      ],
    }),
    defaultConfig: {
      statuses: DEFAULT_STATUSES,
    },
    summarizeConfig: (config) =>
      summarizeMultiselect(
        config,
        "statuses",
        STATUS_OPTIONS,
        DEFAULT_STATUSES,
      ),
  },
];
