import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";

const NEW_PERMISSION_KEYS = [
  PERMISSIONS.CUSTOMERS_READ,
  PERMISSIONS.CUSTOMERS_CREATE,
  PERMISSIONS.CUSTOMERS_UPDATE,
  PERMISSIONS.CUSTOMERS_DELETE,
  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_CREATE,
  PERMISSIONS.ORDERS_UPDATE,
  PERMISSIONS.ORDERS_DELETE,
  PERMISSIONS.ORDERS_MANAGE,
];

const customerEmails: string[] = [];
const orderIds: string[] = [];
const productIds: string[] = [];

function uniqueEmail(): string {
  return `customer-${randomUUID()}@example.com`;
}

function uniqueOrderNumber(): string {
  return `PW-2026-${randomUUID()}`;
}

afterEach(async () => {
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
  await db.customer.deleteMany({ where: { email: { in: customerEmails } } });
  await db.product.deleteMany({ where: { id: { in: productIds } } });
  customerEmails.length = 0;
  orderIds.length = 0;
  productIds.length = 0;
});

describe("order management foundation", () => {
  describe("permission keys", () => {
    it("registers every customers and orders permission key in the catalog", async () => {
      const permissions = await db.permission.findMany({
        where: { key: { in: NEW_PERMISSION_KEYS } },
      });

      expect(permissions.map(({ key }) => key).sort()).toEqual(
        [...NEW_PERMISSION_KEYS].sort(),
      );
    });

    it("assigns the new keys to the ADMIN role", async () => {
      const admin = await db.role.findUniqueOrThrow({
        where: { key: "ADMIN" },
        include: { permissions: { include: { permission: true } } },
      });
      const adminKeys = admin.permissions.map(
        ({ permission }) => permission.key,
      );

      for (const key of NEW_PERMISSION_KEYS) {
        expect(adminKeys).toContain(key);
      }
    });

    it("is recognized by the authorization policy", () => {
      expect(getProcedurePermissions("customers.getMany")).toEqual([
        PERMISSIONS.CUSTOMERS_READ,
      ]);
      expect(getProcedurePermissions("orders.getMany")).toEqual([
        PERMISSIONS.ORDERS_READ,
      ]);
      expect(getProcedurePermissions("orders.complete")).toEqual([
        PERMISSIONS.ORDERS_MANAGE,
      ]);
      expect(getProcedurePermissions("orders.cancel")).toEqual([
        PERMISSIONS.ORDERS_MANAGE,
      ]);
    });
  });

  describe("tables", () => {
    it("persists a customer, order, item and payment with the expected defaults", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const customer = await db.customer.create({
        data: { email, name: "Ada Lovelace", phone: "+39 000" },
      });
      expect(customer.userId).toBeNull();

      const product = await db.product.create({
        data: {
          title: "Writing course",
          slug: `writing-course-${randomUUID()}`,
          type: ProductType.SERVICE,
          version: 1,
          price: 120,
        },
      });
      productIds.push(product.id);

      const order = await db.order.create({
        data: {
          orderNumber: uniqueOrderNumber(),
          customerId: customer.id,
          totalAmount: 120,
          items: {
            create: {
              productId: product.id,
              nameSnapshot: product.title,
              unitPrice: 120,
              quantity: 1,
              totalPrice: 120,
            },
          },
        },
      });
      orderIds.push(order.id);

      expect(order.status).toBe(OrderStatus.DRAFT);
      expect(order.source).toBe(OrderSource.MANUAL);
      expect(order.currency).toBe("EUR");

      const payment = await db.payment.create({
        data: { orderId: order.id, amount: 120 },
      });
      expect(payment.method).toBe(PaymentMethod.OFFLINE);
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.currency).toBe("EUR");

      const loaded = await db.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { customer: true, items: true, payments: true },
      });
      expect(loaded.customer.email).toBe(email);
      expect(loaded.items).toHaveLength(1);
      expect(loaded.items[0]?.nameSnapshot).toBe(product.title);
      expect(loaded.payments).toHaveLength(1);
    });

    it("enforces unique customer emails", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      await db.customer.create({ data: { email } });

      await expect(db.customer.create({ data: { email } })).rejects.toThrow();
    });

    it("enforces unique order numbers", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);
      const customer = await db.customer.create({ data: { email } });
      const orderNumber = uniqueOrderNumber();

      const order = await db.order.create({
        data: { orderNumber, customerId: customer.id, totalAmount: 0 },
      });
      orderIds.push(order.id);

      await expect(
        db.order.create({
          data: { orderNumber, customerId: customer.id, totalAmount: 0 },
        }),
      ).rejects.toThrow();
    });
  });
});
