import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { passthroughEffects } from "@/modules/automations/lib/effects";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";
import { FORM_SUBMITTED_NODE_TYPE } from "@/modules/forms/automations/constants";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";
import { CREATE_CUSTOMER_NODE_TYPE } from "@/modules/shop/customers/automations/constants";
import { CREATE_ORDER_NODE_TYPE } from "@/modules/shop/orders/automations/constants";
import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationStatus,
  OrderSource,
  OrderStatus,
  ProductType,
} from "@/generated/prisma";

function uniqueEmail(): string {
  return `flow-customer-${randomUUID()}@example.com`;
}

async function createProduct(price: number) {
  return db.product.create({
    data: {
      title: `Flow Product ${randomUUID()}`,
      slug: `flow-product-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 1,
      price,
    },
  });
}

const customerIds: string[] = [];
const productIds: string[] = [];

beforeEach(async () => {
  await cleanupAutomationTables();
});

afterEach(async () => {
  if (customerIds.length > 0) {
    await db.order.deleteMany({ where: { customerId: { in: customerIds } } });
    await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  }
  if (productIds.length > 0) {
    await db.product.deleteMany({ where: { id: { in: productIds } } });
  }
  customerIds.length = 0;
  productIds.length = 0;
});

describe("FORM_SUBMITTED -> CREATE_CUSTOMER -> CREATE_ORDER", () => {
  it("creates the customer and the order from the form data end to end", async () => {
    const email = uniqueEmail();
    const product = await createProduct(90);
    productIds.push(product.id);

    await db.automation.create({
      data: {
        name: "Form to order",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            {
              id: "form",
              type: FORM_SUBMITTED_NODE_TYPE,
              data: { formId: "flow-form" },
            },
            {
              id: "create-customer",
              type: CREATE_CUSTOMER_NODE_TYPE,
              data: {
                email: "{{ payload.email }}",
                name: "{{ payload.data.name }}",
              },
            },
            {
              id: "create-order",
              type: CREATE_ORDER_NODE_TYPE,
              data: {
                customerId: "{{ input.customerId }}",
                items: [{ productId: product.id, quantity: 3 }],
              },
            },
          ],
          connections: [
            { fromNodeId: "form", toNodeId: "create-customer" },
            { fromNodeId: "create-customer", toNodeId: "create-order" },
          ],
        } as never,
      },
    });

    await emitFormSubmitted({
      formId: "flow-form",
      email,
      data: { name: "Grace Hopper" },
    });

    // No explicit registry: exercises the composed runtime the pump uses.
    await pumpDueAutomations({ effects: passthroughEffects });

    const customer = await db.customer.findUniqueOrThrow({ where: { email } });
    customerIds.push(customer.id);
    expect(customer.name).toBe("Grace Hopper");

    const order = await db.order.findFirstOrThrow({
      where: { customerId: customer.id },
      include: { items: true },
    });
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.source).toBe(OrderSource.AUTOMATION);
    expect(order.totalAmount).toBe(270);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(3);

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });
});
