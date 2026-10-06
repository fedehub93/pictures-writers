/**
 * Shape of the `order.completed` Run payload. Shared by the trigger's default
 * palette data and the emitter so the two cannot drift.
 */
export type OrderCompletedItemPayload = {
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type OrderCompletedPayload = {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  /** When the order was completed, ISO-8601. */
  completedAt: string;
  items: OrderCompletedItemPayload[];
};
