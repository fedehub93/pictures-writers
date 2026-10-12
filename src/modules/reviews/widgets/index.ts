import { Star } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { PendingReviewsWidget } from "./pending-reviews-widget";

/**
 * The reviews module's contribution to the dashboard catalog: the moderation
 * widget, owned here because it reads Review data.
 */
export const reviewsDashboardWidgets: WidgetDefinition[] = [
  {
    id: "pending-reviews",
    title: "Reviews to moderate",
    description: "Reviews not published yet.",
    icon: Star,
    group: "shop",
    permission: PERMISSIONS.REVIEWS_READ,
    defaultSize: "medium",
    component: PendingReviewsWidget,
  },
];
