import {
  CalendarClock,
  FileText,
  ShoppingCart,
  Star,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";

import type { WidgetDefinition } from "./types";
import { DraftsWidget } from "./ui/widgets/drafts-widget";
import { FailedRunsWidget } from "./ui/widgets/failed-runs-widget";
import { PendingOrdersWidget } from "./ui/widgets/pending-orders-widget";
import { PendingReviewsWidget } from "./ui/widgets/pending-reviews-widget";
import { ScheduledWidget } from "./ui/widgets/scheduled-widget";
import { TrendWidget } from "./ui/widgets/trend-widget";

/**
 * The code-defined catalog of Dashboard widgets. Adding a widget is one module
 * plus one entry here; the dashboard view never changes. The catalog is not a
 * default layout: a new user's dashboard is empty, and every widget is added
 * from the library.
 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "drafts",
    title: "Drafts to publish",
    description: "Posts still in draft, ready to be published.",
    icon: FileText,
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "medium",
    component: DraftsWidget,
  },
  {
    id: "scheduled",
    title: "Scheduled content",
    description: "Content with a planned publication in the future.",
    icon: CalendarClock,
    permission: PERMISSIONS.POSTS_READ,
    defaultSize: "medium",
    component: ScheduledWidget,
  },
  {
    id: "pending-reviews",
    title: "Reviews to moderate",
    description: "Reviews not published yet.",
    icon: Star,
    permission: PERMISSIONS.REVIEWS_READ,
    defaultSize: "medium",
    component: PendingReviewsWidget,
  },
  {
    id: "pending-orders",
    title: "Orders to fulfil",
    description: "Confirmed orders not completed yet.",
    icon: ShoppingCart,
    permission: PERMISSIONS.ORDERS_READ,
    defaultSize: "medium",
    component: PendingOrdersWidget,
  },
  {
    id: "failed-runs",
    title: "Failed automations",
    description: "Automation runs that ended with an error.",
    icon: TriangleAlert,
    permission: PERMISSIONS.AUTOMATIONS_READ,
    defaultSize: "medium",
    component: FailedRunsWidget,
  },
  {
    id: "trend",
    title: "Trend",
    description: "One site metric over time.",
    icon: TrendingUp,
    category: "analytics",
    defaultSize: "medium",
    component: TrendWidget,
    // The Trend is the first configurable widget: the gear lets the user pick
    // which permitted metric this instance renders.
    configSchema: ({ metrics }) => ({
      fields: [
        {
          type: "select",
          name: "metric",
          label: "Metric",
          options: metrics.map((metric) => ({
            value: metric.id,
            label: metric.label,
          })),
        },
      ],
    }),
  },
];

export const getWidgetDefinition = (id: string) =>
  WIDGET_DEFINITIONS.find((definition) => definition.id === id);

/** Whether a definition belongs to the analytics fascia (governed by the range). */
export const isAnalyticsWidget = (definition: WidgetDefinition) =>
  definition.category === "analytics";
