import { ShoppingCart } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import type { WidgetDefinition } from "@/shared/dashboard/types";

import { PendingOrdersWidget } from "./pending-orders-widget";

/**
 * The orders module's contribution to the dashboard catalog: the fulfilment
 * widget, owned here because it reads Order data.
 */
export const ordersDashboardWidgets: WidgetDefinition[] = [
  {
    id: "pending-orders",
    title: "Orders",
    description: "Orders awaiting completion.",
    icon: ShoppingCart,
    group: "shop",
    permission: PERMISSIONS.ORDERS_READ,
    defaultSize: "medium",
    // Room for the headline count, a couple of rows, and the footer link.
    minGrid: { w: 3, h: 3 },
    component: PendingOrdersWidget,
  },
];
