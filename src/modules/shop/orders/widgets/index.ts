import { ShoppingCart } from "lucide-react";

import { OrderStatus } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";
import type {
  WidgetConfigOption,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { OrdersWidget, OrdersWidgetSkeleton } from "./orders-widget";

const STATUS_OPTIONS: WidgetConfigOption[] = [
  { value: OrderStatus.DRAFT, label: "Draft" },
  { value: OrderStatus.PENDING, label: "Pending" },
  { value: OrderStatus.COMPLETED, label: "Completed" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
];

const DEFAULT_STATUSES = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

/**
 * The orders module's contribution to the dashboard catalog: the orders table,
 * owned here because it reads Order data and is gated by the orders permission.
 * Its config narrows the list to any set of statuses; left untouched it shows
 * every status.
 */
export const ordersDashboardWidgets: WidgetDefinition[] = [
  {
    id: "orders",
    title: "Orders",
    description: "Orders, most recent first.",
    icon: ShoppingCart,
    group: "shop",
    permission: PERMISSIONS.ORDERS_READ,
    defaultSize: "full",
    // A table needs room for its header, a few rows, and the footer to stay
    // legible; below this the body scrolls instead of spilling out of the card.
    minGrid: { w: 6, h: 4 },
    component: OrdersWidget,
    loadingFallback: OrdersWidgetSkeleton,
    configSchema: () => ({
      fields: [
        {
          type: "multiselect",
          name: "statuses",
          label: "Statuses",
          options: STATUS_OPTIONS,
        },
      ],
    }),
    defaultConfig: {
      statuses: DEFAULT_STATUSES,
    },
  },
];
