import { OrderStatus } from "@/generated/prisma";

/**
 * Single line item as sent to GA4. GA4 requires `item_id`, `item_name`,
 * `price` and `quantity` to attribute revenue to a product.
 */
export interface Ga4PurchaseItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

/**
 * GA4 `purchase` event pushed through GTM on order completion. Kept free of any
 * Prisma/runtime import so it can be built and asserted in a pure unit test.
 */
export interface Ga4PurchaseEvent {
  event: "purchase";
  ecommerce: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Ga4PurchaseItem[];
  };
}

/**
 * Minimal projection of an Order plus its OrderItems needed to build the event.
 * `OrderGetOne` satisfies it structurally, so the client can pass the mutation
 * result straight through.
 */
export interface PurchaseOrderLike {
  status: OrderStatus;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  items: {
    id: string;
    productId: string | null;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
  }[];
}

/**
 * Builds the GA4 ecommerce `purchase` payload for a completed order, or returns
 * `null` for any other status.
 *
 * Duplicate suppression is not done here: the payload is built in the
 * `orders.complete` mutation's `onSuccess`, and that mutation only accepts a
 * `PENDING -> COMPLETED` transition. An order that is already `COMPLETED`
 * throws before `onSuccess` runs, so the event is pushed at most once.
 */
export function buildGa4PurchaseEvent(
  order: PurchaseOrderLike,
): Ga4PurchaseEvent | null {
  if (order.status !== OrderStatus.COMPLETED) {
    return null;
  }

  return {
    event: "purchase",
    ecommerce: {
      transaction_id: order.orderNumber,
      value: order.totalAmount,
      currency: order.currency,
      items: order.items.map((item) => ({
        item_id: item.productId ?? item.id,
        item_name: item.nameSnapshot,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    },
  };
}
