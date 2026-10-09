import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { enqueueRun } from "@/modules/automations/lib/automation-ingestion";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { passthroughEffects } from "@/modules/automations/lib/effects";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";
import { createProductRoot } from "@/modules/shop/products/lib/__tests__/root-fixtures";
import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma";

import { createOrderNodeCatalogEntry } from "../catalog";
import { CREATE_ORDER_NODE_TYPE } from "../constants";
import { createOrderNodeRegistry } from "../node";

function uniqueEmail(): string {
  return `automation-order-${randomUUID()}@example.com`;
}

async function createCustomer() {
  return db.customer.create({ data: { email: uniqueEmail() } });
}

async function createProduct(price: number) {
  const { root, version } = await createProductRoot({ price });
  productIds.push(root.id);
  return { id: root.id, title: version.title };
}

async function publishGraph(graph: unknown) {
  return db.automation.create({
    data: {
      name: "Create order",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as never,
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
    await db.productRoot.deleteMany({ where: { id: { in: productIds } } });
  }
  customerIds.length = 0;
  productIds.length = 0;
});

describe("CREATE_ORDER node", () => {
  it("is offered in the palette as an action", () => {
    expect(createOrderNodeCatalogEntry.type).toBe(CREATE_ORDER_NODE_TYPE);
    expect(createOrderNodeCatalogEntry.category).toBe("action");
    expect(createOrderNodeCatalogEntry.label).toBe("Create order");
  });

  it("registers a handler under the canonical action key", () => {
    expect(Object.keys(createOrderNodeRegistry)).toContain("createOrder");
  });

  it("creates a pending automation order with snapshots and an offline payment", async () => {
    const customer = await createCustomer();
    customerIds.push(customer.id);
    const product = await createProduct(120);

    const automation = await publishGraph({
      nodes: [
        { id: "trigger", type: "MANUAL_TRIGGER", data: {} },
        {
          id: "create-order",
          type: CREATE_ORDER_NODE_TYPE,
          data: {
            customerId: "{{ payload.customerId }}",
            items: [{ productId: product.id, quantity: 2 }],
            notes: "automation order",
          },
        },
      ],
      connections: [{ fromNodeId: "trigger", toNodeId: "create-order" }],
    });

    await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { customerId: customer.id },
    });

    await pumpDueAutomations({
      registry: createOrderNodeRegistry,
      effects: passthroughEffects,
    });

    const order = await db.order.findFirstOrThrow({
      where: { customerId: customer.id },
      include: { items: true, payments: true },
    });

    expect(order.orderNumber).toMatch(/^PW-\d{4}-\d{6}$/);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.source).toBe(OrderSource.AUTOMATION);
    expect(order.totalAmount).toBe(240);
    expect(order.notes).toBe("automation order");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.nameSnapshot).toBe(product.title);
    expect(order.items[0]?.unitPrice).toBe(120);
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0]?.method).toBe(PaymentMethod.OFFLINE);
    expect(order.payments[0]?.status).toBe(PaymentStatus.PENDING);

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });

  it("fails the step when the customer cannot be resolved", async () => {
    const automation = await publishGraph({
      nodes: [
        { id: "trigger", type: "MANUAL_TRIGGER", data: {} },
        {
          id: "create-order",
          type: CREATE_ORDER_NODE_TYPE,
          data: {
            customerId: "{{ payload.customerId }}",
            items: [{ productId: "missing", quantity: 1 }],
          },
        },
      ],
      connections: [{ fromNodeId: "trigger", toNodeId: "create-order" }],
    });

    await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { customerId: randomUUID() },
    });

    await pumpDueAutomations({
      registry: createOrderNodeRegistry,
      effects: passthroughEffects,
    });

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.FAILED);
  });
});
