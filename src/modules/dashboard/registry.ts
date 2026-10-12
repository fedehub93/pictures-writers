import { TrendingUp } from "lucide-react";

import { automationsDashboardWidgets } from "@/modules/automations/widgets";
import { postsDashboardWidgets } from "@/modules/blog/posts/widgets";
import { reviewsDashboardWidgets } from "@/modules/reviews/widgets";
import { schedulerDashboardWidgets } from "@/modules/scheduler/widgets";
import { ordersDashboardWidgets } from "@/modules/shop/orders/widgets";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { TrendWidget } from "./ui/widgets/trend-widget";

/**
 * The code-defined catalog of Dashboard widgets. The dashboard is the
 * composition root: it aggregates the definitions each domain module owns and
 * adds the generic Trend. The catalog is not a default layout: a new user's
 * dashboard is empty, and every widget is added from the library.
 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  ...postsDashboardWidgets,
  ...schedulerDashboardWidgets,
  ...reviewsDashboardWidgets,
  ...ordersDashboardWidgets,
  ...automationsDashboardWidgets,
  {
    id: "trend",
    title: "Trend",
    description: "One site metric over time.",
    icon: TrendingUp,
    group: "analytics",
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
