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
    title: "Reviews",
    description: "Customer reviews awaiting moderation.",
    icon: Star,
    group: "shop",
    permission: PERMISSIONS.REVIEWS_READ,
    defaultSize: "medium",
    // Room for the headline count, a couple of rows, and the footer link.
    minGrid: { w: 3, h: 3 },
    component: PendingReviewsWidget,
  },
];
