import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

import {
  CREATE_ORDER_NODE_TYPE,
  ORDER_COMPLETED_NODE_TYPE,
} from "./constants";
import type { OrderCompletedPayload } from "./types";

/** Palette entry the orders module contributes for the `CREATE_ORDER` action. */
export const createOrderNodeCatalogEntry: AutomationNodeCatalogEntry = {
  type: CREATE_ORDER_NODE_TYPE,
  label: "Create order",
  description: "Creates a pending order for a customer.",
  category: "action",
  defaultData: {
    customerId: "{{ input.customerId }}",
    items: [{ productId: "", quantity: 1 }],
    notes: "",
  },
};

/**
 * Default `data` the editor seeds for a new `order.completed` trigger. It
 * mirrors the payload the runtime hands to the Run, so expression assistance
 * can point at `{{ payload.customerEmail }}`, `{{ payload.orderNumber }}`, etc.
 * out of the box.
 */
export const orderCompletedTriggerDefaultData: OrderCompletedPayload = {
  orderId: "",
  orderNumber: "",
  customerId: "",
  customerEmail: "",
  totalAmount: 0,
  currency: "EUR",
  completedAt: "",
  items: [],
};

/** Palette entry the orders module contributes for the `order.completed` trigger. */
export const orderCompletedTriggerCatalogEntry: AutomationNodeCatalogEntry = {
  type: ORDER_COMPLETED_NODE_TYPE,
  label: "Order completed",
  description: "Starts the flow when an order is completed.",
  category: "trigger",
  defaultData: orderCompletedTriggerDefaultData,
};
