import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the protected procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
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

import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";

import { ordersRouter } from "../server/procedures";

const createCaller = createCallerFactory(ordersRouter);
const TEST_USER_ID = "test-user";
const caller = createCaller({
  userId: TEST_USER_ID,
  auth: { id: TEST_USER_ID },
});

const customerIds: string[] = [];
const productIds: string[] = [];

function uniqueEmail(): string {
  return `order-customer-${randomUUID()}@example.com`;
}

async function createCustomer() {
  const customer = await db.customer.create({
    data: { email: uniqueEmail(), name: "Order Customer" },
  });
  customerIds.push(customer.id);
  return customer;
}

async function createProduct(price: number | null = 100) {
  const product = await db.product.create({
    data: {
      title: `Product ${randomUUID()}`,
      slug: `product-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 1,
      price,
    },
  });
  productIds.push(product.id);
  return product;
}

beforeEach(() => {
  customerIds.length = 0;
  productIds.length = 0;
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

describe("ordersRouter", () => {
  describe("create", () => {
    it("creates a draft order with a generated number, price snapshots and a pending offline payment", async () => {
      const customer = await createCustomer();
      const product = await createProduct(120);

      const created = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }],
      });

      expect(created.orderNumber).toMatch(/^PW-\d{4}-\d{6}$/);
      expect(created.status).toBe(OrderStatus.DRAFT);
      expect(created.source).toBe("MANUAL");
      expect(created.totalAmount).toBe(240);
      expect(created.items).toHaveLength(1);
      expect(created.items[0]?.nameSnapshot).toBe(product.title);
      expect(created.items[0]?.unitPrice).toBe(120);
      expect(created.items[0]?.quantity).toBe(2);
      expect(created.items[0]?.totalPrice).toBe(240);
      expect(created.payments).toHaveLength(1);
      expect(created.payments[0]?.method).toBe(PaymentMethod.OFFLINE);
      expect(created.payments[0]?.status).toBe(PaymentStatus.PENDING);
      expect(created.payments[0]?.amount).toBe(240);
    });

    it("sums the total from every line", async () => {
      const customer = await createCustomer();
      const first = await createProduct(50);
      const second = await createProduct(30);

      const created = await caller.create({
        customerId: customer.id,
        items: [
          { productId: first.id, quantity: 3 },
          { productId: second.id, quantity: 1 },
        ],
      });

      expect(created.totalAmount).toBe(180);
      expect(created.items).toHaveLength(2);
    });

    it("keeps the price snapshot even if the product price changes later", async () => {
      const customer = await createCustomer();
      const product = await createProduct(100);

      const created = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      await db.product.update({
        where: { id: product.id },
        data: { price: 250 },
      });

      const loaded = await caller.getOne({ id: created.id });
      expect(loaded.items[0]?.unitPrice).toBe(100);
      expect(loaded.totalAmount).toBe(100);
    });

    it("generates a distinct sequential order number", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);

      const first = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      const second = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      expect(first.orderNumber).not.toBe(second.orderNumber);
    });

    it("normalizes a null product price to zero", async () => {
      const customer = await createCustomer();
      const product = await createProduct(null);

      const created = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }],
      });

      expect(created.totalAmount).toBe(0);
    });

    it("rejects an unknown customer", async () => {
      const product = await createProduct(10);

      await expect(
        caller.create({
          customerId: randomUUID(),
          items: [{ productId: product.id, quantity: 1 }],
        }),
      ).rejects.toThrow();
    });

    it("rejects an unknown product", async () => {
      const customer = await createCustomer();

      await expect(
        caller.create({
          customerId: customer.id,
          items: [{ productId: randomUUID(), quantity: 1 }],
        }),
      ).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope with the customer and item count", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);

      await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 100,
        search: customer.email,
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0]?.customer.email).toBe(customer.email);
      expect(result.items[0]?._count.items).toBe(1);
      expect(result.items[0]?.totalAmount).toBe(10);
    });

    it("filters by status", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);

      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });

      const drafts = await caller.getMany({
        page: 1,
        pageSize: 100,
        search: customer.email,
        status: OrderStatus.DRAFT,
      });
      const pending = await caller.getMany({
        page: 1,
        pageSize: 100,
        search: customer.email,
        status: OrderStatus.PENDING,
      });

      expect(drafts.total).toBe(0);
      expect(pending.total).toBe(1);
    });

    it("does not return orders that do not match the search", async () => {
      const result = await caller.getMany({
        page: 1,
        pageSize: 10,
        search: randomUUID(),
      });

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("getOne", () => {
    it("returns the customer, the line items and the payments", async () => {
      const customer = await createCustomer();
      const product = await createProduct(80);

      const created = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.customer.id).toBe(customer.id);
      expect(loaded.items).toHaveLength(1);
      expect(loaded.payments).toHaveLength(1);
    });

    it("throws NOT_FOUND for an unknown order", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("confirm", () => {
    it("moves a draft order to pending", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      const confirmed = await caller.confirm({ id: order.id });

      expect(confirmed.status).toBe(OrderStatus.PENDING);
    });

    it("rejects confirming an order that is not a draft", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });

      await expect(caller.confirm({ id: order.id })).rejects.toThrow();
    });
  });

  describe("complete", () => {
    it("completes a pending order, records the actor and settles the offline payment", async () => {
      const customer = await createCustomer();
      const product = await createProduct(200);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });

      const completed = await caller.complete({ id: order.id });

      expect(completed.status).toBe(OrderStatus.COMPLETED);
      expect(completed.completedAt).toBeInstanceOf(Date);
      expect(completed.completedBy).toBe(TEST_USER_ID);

      const payments = await db.payment.findMany({
        where: { orderId: order.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0]?.status).toBe(PaymentStatus.COMPLETED);
      expect(payments[0]?.paidAt).toBeInstanceOf(Date);
    });

    it("refuses to complete a draft order", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      await expect(caller.complete({ id: order.id })).rejects.toThrow();
    });

    it("refuses to complete an already completed order", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });
      await caller.complete({ id: order.id });

      await expect(caller.complete({ id: order.id })).rejects.toThrow();
    });
  });

  describe("cancel", () => {
    it("cancels a pending order", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });

      const cancelled = await caller.cancel({ id: order.id });

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it("cancels a draft order", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });

      const cancelled = await caller.cancel({ id: order.id });

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it("refuses to cancel a completed order", async () => {
      const customer = await createCustomer();
      const product = await createProduct(10);
      const order = await caller.create({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
      await caller.confirm({ id: order.id });
      await caller.complete({ id: order.id });

      await expect(caller.cancel({ id: order.id })).rejects.toThrow();
    });
  });

  describe("permissions", () => {
    it("requires orders.manage to complete or cancel an order", () => {
      expect(getProcedurePermissions("orders.complete")).toEqual([
        PERMISSIONS.ORDERS_MANAGE,
      ]);
      expect(getProcedurePermissions("orders.cancel")).toEqual([
        PERMISSIONS.ORDERS_MANAGE,
      ]);
    });

    it("requires orders.read for the list and orders.create for creation", () => {
      expect(getProcedurePermissions("orders.getMany")).toEqual([
        PERMISSIONS.ORDERS_READ,
      ]);
      expect(getProcedurePermissions("orders.create")).toEqual([
        PERMISSIONS.ORDERS_CREATE,
        PERMISSIONS.ORDERS_MANAGE,
      ]);
    });
  });
});
