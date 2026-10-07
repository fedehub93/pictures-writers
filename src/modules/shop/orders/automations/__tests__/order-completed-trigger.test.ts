import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The router only needs the router builders, not the auth middleware. Mocking
// the protected procedure lets us exercise complete() against the test DB.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";
import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationStatus,
  ProductType,
} from "@/generated/prisma";

import { ordersRouter } from "@/modules/shop/orders/server/procedures";

import { orderCompletedTriggerCatalogEntry } from "../catalog";
import {
  ORDER_COMPLETED_NODE_TYPE,
  ORDER_COMPLETED_TRIGGER_TYPE,
} from "../constants";
import { orderCompletedNodeRegistry } from "../node";

const createCaller = createCallerFactory(ordersRouter);
const TEST_USER_ID = "test-user";
const caller = createCaller({
  userId: TEST_USER_ID,
  auth: { id: TEST_USER_ID },
});

const customerIds: string[] = [];
const productIds: string[] = [];

function uniqueEmail(): string {
  return `completed-order-${randomUUID()}@example.com`;
}

async function createProduct(price: number) {
  const product = await db.product.create({
    data: {
      title: `Completed Product ${randomUUID()}`,
      slug: `completed-product-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 1,
      price,
    },
  });
  productIds.push(product.id);
  return product;
}

async function createPendingOrder() {
  const customer = await db.customer.create({
    data: { email: uniqueEmail(), name: "Order Customer" },
  });
  customerIds.push(customer.id);
  const product = await createProduct(50);

  const order = await caller.create({
    customerId: customer.id,
    items: [{ productId: product.id, quantity: 2 }],
  });
  await caller.confirm({ id: order.id });

  return { customer, product, order };
}

async function publishGraph(graph: unknown) {
  return db.automation.create({
    data: {
      name: "Post purchase",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as never,
    },
  });
}

const orderCompletedGraph = {
  nodes: [
    { id: "order-completed", type: ORDER_COMPLETED_NODE_TYPE, data: {} },
    {
      id: "send",
      type: "SEND_EMAIL",
      data: {
        recipient: "{{ payload.customerEmail }}",
        subject: "Order {{ payload.orderNumber }} completed",
        body: "Thanks!",
      },
    },
  ],
  connections: [{ fromNodeId: "order-completed", toNodeId: "send" }],
};

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

describe("order.completed trigger", () => {
  it("is offered in the palette with a payload-shaped default", () => {
    expect(orderCompletedTriggerCatalogEntry.type).toBe(
      ORDER_COMPLETED_NODE_TYPE,
    );
    expect(orderCompletedTriggerCatalogEntry.category).toBe("trigger");
    expect(orderCompletedTriggerCatalogEntry.label).toBe("Order completed");
    expect(orderCompletedTriggerCatalogEntry.defaultData).toMatchObject({
      orderId: expect.any(String),
      orderNumber: expect.any(String),
      customerId: expect.any(String),
      customerEmail: expect.any(String),
      totalAmount: expect.any(Number),
      currency: expect.any(String),
      completedAt: expect.any(String),
      items: expect.any(Array),
    });
  });

  it("registers a passthrough handler for the trigger", () => {
    expect(Object.keys(orderCompletedNodeRegistry)).toContain(
      "order_completed",
    );
  });

  it("emits order.completed when an order is completed and starts a subscribed automation", async () => {
    const { customer, order } = await createPendingOrder();
    await publishGraph(orderCompletedGraph);

    await caller.complete({ id: order.id });

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(ORDER_COMPLETED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.idempotencyKey).toBe(order.id);
    expect(run.payload).toMatchObject({
      orderId: order.id,
      customerId: customer.id,
      customerEmail: customer.email,
      totalAmount: 100,
      currency: "EUR",
    });

    const effects = createInMemoryEffects();
    await pumpDueAutomations({ effects });

    expect(effects.mailCalls).toHaveLength(1);
    expect(effects.mailCalls[0]).toMatchObject({
      config: { recipient: customer.email },
    });

    const finished = await db.automationRun.findUniqueOrThrow({
      where: { id: run.id },
    });
    expect(finished.status).toBe(AutomationRunStatus.COMPLETED);
  });

  it("does not start a run for a differently triggered automation", async () => {
    const { order } = await createPendingOrder();
    await publishGraph({
      nodes: [
        { id: "form", type: "FORM_SUBMITTED_TRIGGER", data: { formId: "x" } },
        { id: "send", type: "SEND_EMAIL", data: { recipient: "a@b.c", subject: "s", body: "b" } },
      ],
      connections: [{ fromNodeId: "form", toNodeId: "send" }],
    });

    await caller.complete({ id: order.id });

    expect(await db.automationRun.count()).toBe(0);
  });
});
