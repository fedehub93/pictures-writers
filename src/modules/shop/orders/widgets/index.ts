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
    title: "Orders to fulfil",
    description: "Confirmed orders not completed yet.",
    icon: ShoppingCart,
    group: "shop",
    permission: PERMISSIONS.ORDERS_READ,
    defaultSize: "medium",
    component: PendingOrdersWidget,
  },
];
