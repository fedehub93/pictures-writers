import { TrendingUp } from "lucide-react";

import { automationsDashboardWidgets } from "@/modules/automations/widgets";
import { postsDashboardWidgets } from "@/modules/blog/posts/widgets";
import { reviewsDashboardWidgets } from "@/modules/reviews/widgets";
import { schedulerDashboardWidgets } from "@/modules/scheduler/widgets";
import { ordersDashboardWidgets } from "@/modules/shop/orders/widgets";
import type {
  WidgetConfigField,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { resolveMetric } from "./lib/metric-selection";
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
    // which permitted metric this instance renders, and — for the
    // form-submissions metric — which dynamic forms it counts.
    configSchema: ({ metrics, forms }, config) => {
      const fields: WidgetConfigField[] = [
        {
          type: "select",
          name: "metric",
          label: "Metric",
          options: metrics.map((metric) => ({
            value: metric.id,
            label: metric.label,
          })),
        },
      ];

      // The form filter only means anything for the form-submissions metric, so
      // it appears only once that metric is selected. With no config yet the
      // Trend renders the first permitted metric, so the field matches it.
      const selectedMetric =
        typeof config?.metric === "string" ? config.metric : metrics[0]?.id;

      if (selectedMetric === "submissions" && forms.length > 0) {
        fields.push({
          type: "multiselect",
          name: "forms",
          label: "Forms",
          allByDefault: true,
          options: forms.map((form) => ({
            value: form.id,
            label: form.label,
          })),
        });
      }

      return { fields };
    },
    resolveTitle: ({ metrics }, config) =>
      resolveMetric(config, metrics)?.label ?? "Trend",
  },
];

export const getWidgetDefinition = (id: string) =>
  WIDGET_DEFINITIONS.find((definition) => definition.id === id);
