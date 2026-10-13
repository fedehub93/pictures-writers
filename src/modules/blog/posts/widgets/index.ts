import { FileText } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { DraftsWidget, DraftsWidgetSkeleton } from "./drafts-widget";

/**
 * The blog module's contribution to the dashboard catalog: the content widget,
 * owned here because it reads Post data and is gated by the posts permission.
 * It defaults to the posts awaiting publication — drafts and changed posts —
 * and its config widens the list to any set of statuses.
 */
export const postsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "drafts",
    title: "Content to publish",
    description: "Posts in draft or with unpublished changes.",
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
          options: [
            { value: ContentStatus.DRAFT, label: "Draft" },
            { value: ContentStatus.CHANGED, label: "Changed" },
            { value: ContentStatus.SCHEDULED, label: "Scheduled" },
            { value: ContentStatus.PUBLISHED, label: "Published" },
          ],
        },
      ],
    }),
    defaultConfig: {
      statuses: [ContentStatus.DRAFT, ContentStatus.CHANGED],
    },
  },
];
