import { describe, expect, it } from "vitest";

import { OrderStatus } from "@/generated/prisma";

import {
  buildGa4PurchaseEvent,
  type PurchaseOrderLike,
} from "../lib/ga4-purchase";

function order(overrides: Partial<PurchaseOrderLike> = {}): PurchaseOrderLike {
  return {
    status: OrderStatus.COMPLETED,
    orderNumber: "PW-2026-000001",
    totalAmount: 240,
    currency: "EUR",
    items: [
      {
        id: "item-1",
        productId: "product-1",
        nameSnapshot: "Print A3",
        unitPrice: 120,
        quantity: 2,
      },
    ],
    ...overrides,
  };
}

describe("buildGa4PurchaseEvent", () => {
  it("serialises an order into a GA4 purchase event", () => {
    const event = buildGa4PurchaseEvent(order());

    expect(event).toEqual({
      event: "purchase",
      ecommerce: {
        transaction_id: "PW-2026-000001",
        value: 240,
        currency: "EUR",
        items: [
          {
            item_id: "product-1",
            item_name: "Print A3",
            price: 120,
            quantity: 2,
          },
        ],
      },
    });
  });

  it("maps every line item using the GA4 ecommerce schema", () => {
    const event = buildGa4PurchaseEvent(
      order({
        items: [
          {
            id: "item-1",
            productId: "product-1",
            nameSnapshot: "Print A3",
            unitPrice: 120,
            quantity: 1,
          },
          {
            id: "item-2",
            productId: "product-2",
            nameSnapshot: "Print A4",
            unitPrice: 50,
            quantity: 3,
          },
        ],
      }),
    );

    expect(event?.ecommerce.items).toEqual([
      {
        item_id: "product-1",
        item_name: "Print A3",
        price: 120,
        quantity: 1,
      },
      {
        item_id: "product-2",
        item_name: "Print A4",
        price: 50,
        quantity: 3,
      },
    ]);
  });

  it("falls back to the order item id when the product reference is missing", () => {
    const event = buildGa4PurchaseEvent(
      order({
        items: [
          {
            id: "item-1",
            productId: null,
            nameSnapshot: "Custom order",
            unitPrice: 80,
            quantity: 1,
          },
        ],
      }),
    );

    expect(event?.ecommerce.items[0]?.item_id).toBe("item-1");
  });

  it("returns null when the order was not completed", () => {
    expect(buildGa4PurchaseEvent(order({ status: OrderStatus.PENDING }))).toBe(
      null,
    );
    expect(buildGa4PurchaseEvent(order({ status: OrderStatus.CANCELLED }))).toBe(
      null,
    );
    expect(buildGa4PurchaseEvent(order({ status: OrderStatus.DRAFT }))).toBe(
      null,
    );
  });
});
