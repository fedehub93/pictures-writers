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

import { db } from "@/shared/lib/db";

import { customersRouter } from "../server/procedures";

const createCaller = createCallerFactory(customersRouter);
const caller = createCaller({ userId: "test-user" });

const customerEmails: string[] = [];
const orderIds: string[] = [];

function uniqueEmail(): string {
  return `customer-${randomUUID()}@example.com`;
}

beforeEach(() => {
  customerEmails.length = 0;
  orderIds.length = 0;
});

afterEach(async () => {
  if (orderIds.length > 0) {
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  if (customerEmails.length > 0) {
    await db.customer.deleteMany({ where: { email: { in: customerEmails } } });
  }
  customerEmails.length = 0;
  orderIds.length = 0;
});

describe("customersRouter", () => {
  describe("create", () => {
    it("creates a customer with the provided fields", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const created = await caller.create({
        email,
        name: "Ada Lovelace",
        phone: "+39 000",
        notes: "Pays by bank transfer",
      });

      expect(created.id).toBeTruthy();
      expect(created.email).toBe(email);
      expect(created.name).toBe("Ada Lovelace");
      expect(created.phone).toBe("+39 000");
      expect(created.notes).toBe("Pays by bank transfer");
      expect(created.userId).toBeNull();
    });

    it("normalizes the email to lowercase", async () => {
      const email = uniqueEmail().toUpperCase();
      customerEmails.push(email.toLowerCase());

      const created = await caller.create({ email });

      expect(created.email).toBe(email.toLowerCase());
    });

    it("rejects a duplicate email", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      await caller.create({ email });

      await expect(caller.create({ email })).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the customer together with its orders", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const customer = await caller.create({ email, name: "Ada" });
      const order = await db.order.create({
        data: {
          orderNumber: `PW-2026-${randomUUID()}`,
          customerId: customer.id,
          totalAmount: 120,
        },
      });
      orderIds.push(order.id);

      const loaded = await caller.getOne({ id: customer.id });

      expect(loaded.email).toBe(email);
      expect(loaded.orders).toHaveLength(1);
      expect(loaded.orders[0]?.id).toBe(order.id);
    });

    it("throws NOT_FOUND for an unknown customer", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope and filters by search", async () => {
      const marker = randomUUID();
      const email = `search-${marker}@example.com`;
      customerEmails.push(email);

      await caller.create({ email, name: `Searchable ${marker}` });

      const result = await caller.getMany({
        page: 1,
        pageSize: 10,
        search: marker,
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.email).toBe(email);
    });

    it("does not return customers that do not match the search", async () => {
      const result = await caller.getMany({
        page: 1,
        pageSize: 10,
        search: randomUUID(),
      });

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("updates the editable fields", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const customer = await caller.create({ email });

      const updated = await caller.update({
        id: customer.id,
        email,
        name: "Grace Hopper",
        phone: "+1 555",
        notes: "Updated notes",
      });

      expect(updated.name).toBe("Grace Hopper");
      expect(updated.phone).toBe("+1 555");
      expect(updated.notes).toBe("Updated notes");
    });

    it("rejects an email already used by another customer", async () => {
      const firstEmail = uniqueEmail();
      const secondEmail = uniqueEmail();
      customerEmails.push(firstEmail, secondEmail);

      await caller.create({ email: firstEmail });
      const second = await caller.create({ email: secondEmail });

      await expect(
        caller.update({ id: second.id, email: firstEmail }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("deletes a customer without orders", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const customer = await caller.create({ email });

      await caller.remove({ id: customer.id });

      const loaded = await db.customer.findUnique({
        where: { id: customer.id },
      });
      expect(loaded).toBeNull();
      customerEmails.length = 0;
    });

    it("refuses to delete a customer that has orders", async () => {
      const email = uniqueEmail();
      customerEmails.push(email);

      const customer = await caller.create({ email });
      const order = await db.order.create({
        data: {
          orderNumber: `PW-2026-${randomUUID()}`,
          customerId: customer.id,
          totalAmount: 0,
        },
      });
      orderIds.push(order.id);

      await expect(caller.remove({ id: customer.id })).rejects.toThrow();

      const stillThere = await db.customer.findUnique({
        where: { id: customer.id },
      });
      expect(stillThere).not.toBeNull();
    });
  });
});
