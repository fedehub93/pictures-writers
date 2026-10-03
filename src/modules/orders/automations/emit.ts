import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";

import { ORDER_COMPLETED_TRIGGER_TYPE } from "./constants";
import type { OrderCompletedPayload } from "./types";

export interface OrderCompletedEventInput {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  completedAt?: Date | null;
  items: {
    productId: string | null;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  now?: Date;
}

/**
 * Entry point for the internal `order.completed` event. Called by the orders
 * router once an order reaches `COMPLETED`; it hands a domain-shaped payload
 * and the order id as the idempotency key to the domain-agnostic engine.
 */
export async function emitOrderCompleted(
  input: OrderCompletedEventInput,
): Promise<{ runIds: string[] }> {
  const now = input.now ?? new Date();

  const payload: OrderCompletedPayload = {
    orderId: input.id,
    orderNumber: input.orderNumber,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    totalAmount: input.totalAmount,
    currency: input.currency,
    completedAt: (input.completedAt ?? now).toISOString(),
    items: input.items.map((item) => ({
      productId: item.productId,
      name: item.nameSnapshot,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  };

  return enqueueEventRuns({
    triggerType: ORDER_COMPLETED_TRIGGER_TYPE,
    payload,
    idempotencyKey: input.id,
    now,
  });
}
