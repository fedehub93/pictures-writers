import { FileText } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "./types";
import { DraftsWidget } from "./ui/widgets/drafts-widget";

/**
 * The code-defined catalog of Dashboard widgets. Adding a widget is one module
 * plus one entry here; the dashboard view never changes.
 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "drafts",
    title: "Bozze da pubblicare",
    description: "I post ancora in bozza, pronti per la pubblicazione.",
    icon: FileText,
    permission: PERMISSIONS.POSTS_READ,
    size: "medium",
    component: DraftsWidget,
  },
];

/**
 * The registry's default instances, in the order they appear for every user
 * (before the per-user override is applied).
 */
export const DEFAULT_DASHBOARD_INSTANCES: DashboardWidgetInstance[] = [
  { key: "drafts", definitionId: "drafts" },
];

export const getWidgetDefinition = (id: string) =>
  WIDGET_DEFINITIONS.find((definition) => definition.id === id);
