import {
  CalendarClock,
  FileText,
  ShoppingCart,
  Star,
  TrendingUp,
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
import { TrendWidget } from "./ui/widgets/trend-widget";

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
  {
    id: "trend",
    title: "Andamento",
    description: "Una metrica del sito nel tempo.",
    icon: TrendingUp,
    category: "analytics",
    size: "medium",
    component: TrendWidget,
    // The Trend is the first configurable widget: the gear lets the user pick
    // which permitted metric this instance renders.
    configSchema: ({ metrics }) => ({
      fields: [
        {
          type: "select",
          name: "metric",
          label: "Metrica",
          options: metrics.map((metric) => ({
            value: metric.id,
            label: metric.label,
          })),
        },
      ],
    }),
  },
];

/**
 * The registry's default instances, in the order they appear for every user
 * (before the per-user override is applied). Operational widgets come first,
 * then one Trend instance per seeded metric.
 */
export const DEFAULT_DASHBOARD_INSTANCES: DashboardWidgetInstance[] = [
  { key: "drafts", definitionId: "drafts" },
  { key: "scheduled", definitionId: "scheduled" },
  { key: "pending-reviews", definitionId: "pending-reviews" },
  { key: "pending-orders", definitionId: "pending-orders" },
  { key: "failed-runs", definitionId: "failed-runs" },
  { key: "trend-contacts", definitionId: "trend", config: { metric: "contacts" } },
  {
    key: "trend-submissions",
    definitionId: "trend",
    config: { metric: "submissions" },
  },
  { key: "trend-ebooks", definitionId: "trend", config: { metric: "ebooks" } },
  { key: "trend-revenue", definitionId: "trend", config: { metric: "revenue" } },
];

export const getWidgetDefinition = (id: string) =>
  WIDGET_DEFINITIONS.find((definition) => definition.id === id);

/** Whether a definition belongs to the analytics fascia (governed by the range). */
export const isAnalyticsWidget = (definition: WidgetDefinition) =>
  definition.category === "analytics";
