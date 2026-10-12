import { FileText } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { DraftsWidget } from "./drafts-widget";

/**
 * The blog module's contribution to the dashboard catalog: the drafts widget,
 * owned here because it reads Post data and is gated by the posts permission.
 */
export const postsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "drafts",
    title: "Drafts to publish",
    description: "Posts still in draft, ready to be published.",
    icon: FileText,
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "medium",
    component: DraftsWidget,
  },
];
