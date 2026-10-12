import {
  CalendarClock,
  FileText,
  ShoppingCart,
  Star,
  TriangleAlert,
} from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "./types";
import { DraftsWidget } from "./ui/widgets/drafts-widget";
import { FailedRunsWidget } from "./ui/widgets/failed-runs-widget";
import { PendingOrdersWidget } from "./ui/widgets/pending-orders-widget";
import { PendingReviewsWidget } from "./ui/widgets/pending-reviews-widget";
import { ScheduledWidget } from "./ui/widgets/scheduled-widget";

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
  {
    id: "scheduled",
    title: "Contenuti in programmazione",
    description: "I contenuti con una pubblicazione pianificata nel futuro.",
    icon: CalendarClock,
    permission: PERMISSIONS.POSTS_READ,
    size: "medium",
    component: ScheduledWidget,
  },
  {
    id: "pending-reviews",
    title: "Recensioni da moderare",
    description: "Le recensioni non ancora pubblicate.",
    icon: Star,
    permission: PERMISSIONS.REVIEWS_READ,
    size: "medium",
    component: PendingReviewsWidget,
  },
  {
    id: "pending-orders",
    title: "Ordini da completare",
    description: "Gli ordini confermati e non ancora completati.",
    icon: ShoppingCart,
    permission: PERMISSIONS.ORDERS_READ,
    size: "medium",
    component: PendingOrdersWidget,
  },
  {
    id: "failed-runs",
    title: "Automazioni in errore",
    description: "Le esecuzioni di automazione terminate con un errore.",
    icon: TriangleAlert,
    permission: PERMISSIONS.AUTOMATIONS_READ,
    size: "medium",
    component: FailedRunsWidget,
  },
];

/**
 * The registry's default instances, in the order they appear for every user
 * (before the per-user override is applied).
 */
export const DEFAULT_DASHBOARD_INSTANCES: DashboardWidgetInstance[] = [
  { key: "drafts", definitionId: "drafts" },
  { key: "scheduled", definitionId: "scheduled" },
  { key: "pending-reviews", definitionId: "pending-reviews" },
  { key: "pending-orders", definitionId: "pending-orders" },
  { key: "failed-runs", definitionId: "failed-runs" },
];

export const getWidgetDefinition = (id: string) =>
  WIDGET_DEFINITIONS.find((definition) => definition.id === id);
