import { Star } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type {
  WidgetConfigOption,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { ReviewsWidget, ReviewsWidgetSkeleton } from "./reviews-widget";

const STATUS_OPTIONS: WidgetConfigOption[] = [
  { value: "true", label: "Published" },
  { value: "false", label: "Unpublished" },
];

const DEFAULT_STATUSES = ["true", "false"];

/**
 * The reviews module's contribution to the dashboard catalog: the reviews
 * table, owned here because it reads Review data and is gated by the reviews
 * permission. Its config narrows the list to published or unpublished reviews;
 * left untouched it shows every review.
 */
export const reviewsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "reviews",
    title: "Reviews",
    description: "Reviews, most recent first.",
    icon: Star,
    group: "shop",
    permission: PERMISSIONS.REVIEWS_READ,
    defaultSize: "full",
    // A table needs room for its header, a few rows, and the footer to stay
    // legible; below this the body scrolls instead of spilling out of the card.
    minGrid: { w: 6, h: 4 },
    component: ReviewsWidget,
    loadingFallback: ReviewsWidgetSkeleton,
    configSchema: () => ({
      fields: [
        {
          type: "multiselect",
          name: "status",
          label: "Status",
          options: STATUS_OPTIONS,
        },
      ],
    }),
    defaultConfig: {
      status: DEFAULT_STATUSES,
    },
  },
];
