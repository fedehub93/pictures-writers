import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
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

import { emailAccountsRouter } from "../procedures";

const createCaller = createCallerFactory(emailAccountsRouter);

const accountIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

async function createUser() {
  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

async function createAccount(
  overrides: Partial<{
    name: string;
    email: string;
    isActive: boolean;
    isDefault: boolean;
    userIds: string[];
  }> = {},
) {
  const account = await caller.create({
    name: overrides.name ?? `Account ${randomUUID()}`,
    email: overrides.email ?? `inbox-${randomUUID()}@example.com`,
    displayName: null,
    signature: null,
    isActive: overrides.isActive ?? true,
    isDefault: overrides.isDefault ?? false,
    userIds: overrides.userIds ?? [],
  });
  accountIds.push(account.id);
  return account;
}

beforeEach(async () => {
  accountIds.length = 0;
  userIds.length = 0;

  const user = await createUser();
  userId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (accountIds.length > 0) {
    await db.emailAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  accountIds.length = 0;
  userIds.length = 0;
});

describe("emailAccountsRouter", () => {
  describe("create", () => {
    it("creates an active account with assigned users", async () => {
      const member = await createUser();

      const account = await createAccount({ userIds: [member.id] });

      const stored = await db.emailAccount.findUniqueOrThrow({
        where: { id: account.id },
        include: { userPermissions: true },
      });
      expect(stored.isActive).toBe(true);
      expect(stored.isDefault).toBe(false);
      expect(stored.userPermissions.map((p) => p.userId)).toEqual([member.id]);
    });

    it("rejects a duplicate address", async () => {
      const email = `inbox-${randomUUID()}@example.com`;
      await createAccount({ email });

      await expect(createAccount({ email })).rejects.toThrow();
    });

    it("rejects an invalid email address", async () => {
      await expect(
        caller.create({
          name: "Support",
          email: "not-an-email",
          displayName: null,
          signature: null,
          isActive: true,
          isDefault: false,
          userIds: [],
        }),
      ).rejects.toThrow();
    });

    it("rejects a missing name", async () => {
      await expect(
        caller.create({
          name: "   ",
          email: `inbox-${randomUUID()}@example.com`,
          displayName: null,
          signature: null,
          isActive: true,
          isDefault: false,
          userIds: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("default account constraint", () => {
    it("keeps a single default when a second account is created as default", async () => {
      const first = await createAccount({ isDefault: true });
      const second = await createAccount({ isDefault: true });

      const defaults = await db.emailAccount.findMany({
        where: { id: { in: [first.id, second.id] }, isDefault: true },
      });
      expect(defaults).toHaveLength(1);
      expect(defaults[0]!.id).toBe(second.id);

      const reloadedFirst = await db.emailAccount.findUniqueOrThrow({
        where: { id: first.id },
      });
      expect(reloadedFirst.isDefault).toBe(false);
    });

    it("moves the default when another account is updated to default", async () => {
      const first = await createAccount({ isDefault: true });
      const second = await createAccount();

      await caller.update({
        id: second.id,
        name: second.name,
        email: second.email,
        displayName: null,
        signature: null,
        isActive: true,
        isDefault: true,
      });

      const reloadedFirst = await db.emailAccount.findUniqueOrThrow({
        where: { id: first.id },
      });
      const reloadedSecond = await db.emailAccount.findUniqueOrThrow({
        where: { id: second.id },
      });
      expect(reloadedFirst.isDefault).toBe(false);
      expect(reloadedSecond.isDefault).toBe(true);
    });

    it("setDefault leaves exactly one default", async () => {
      const first = await createAccount({ isDefault: true });
      const second = await createAccount();

      await caller.setDefault({ id: second.id });

      const defaults = await db.emailAccount.findMany({
        where: { id: { in: [first.id, second.id] }, isDefault: true },
      });
      expect(defaults).toHaveLength(1);
      expect(defaults[0]!.id).toBe(second.id);
    });

    it("throws NOT_FOUND when setting default on an unknown account", async () => {
      await expect(
        caller.setDefault({ id: randomUUID() }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates the scalar fields and nulls empty optionals", async () => {
      const account = await createAccount();

      const updated = await caller.update({
        id: account.id,
        name: "Support",
        email: account.email,
        displayName: "   ",
        signature: "",
        isActive: false,
        isDefault: false,
      });

      expect(updated.name).toBe("Support");
      expect(updated.displayName).toBeNull();
      expect(updated.signature).toBeNull();
      expect(updated.isActive).toBe(false);
    });

    it("throws NOT_FOUND for an unknown account", async () => {
      await expect(
        caller.update({
          id: randomUUID(),
          name: "Nope",
          email: `inbox-${randomUUID()}@example.com`,
          isActive: true,
          isDefault: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("setActive", () => {
    it("toggles the activation flag", async () => {
      const account = await createAccount({ isActive: true });

      await caller.setActive({ id: account.id, isActive: false });

      const reloaded = await db.emailAccount.findUniqueOrThrow({
        where: { id: account.id },
      });
      expect(reloaded.isActive).toBe(false);
    });
  });

  describe("setUserPermissions", () => {
    it("replaces the set of assigned users", async () => {
      const first = await createUser();
      const second = await createUser();
      const account = await createAccount({ userIds: [first.id] });

      const updated = await caller.setUserPermissions({
        id: account.id,
        userIds: [second.id, second.id, first.id],
      });

      expect(updated.userPermissions.map((p) => p.userId).sort()).toEqual(
        [first.id, second.id].sort(),
      );
    });

    it("clears permissions when the list is empty", async () => {
      const member = await createUser();
      const account = await createAccount({ userIds: [member.id] });

      await caller.setUserPermissions({ id: account.id, userIds: [] });

      expect(await db.emailAccountUserPermission.count({ where: { emailAccountId: account.id } })).toBe(0);
    });
  });

  describe("getAllowed", () => {
    it("returns only the accounts the user is permitted to use", async () => {
      const allowed = await createAccount({ userIds: [userId] });
      await createAccount();

      const result = await caller.getAllowed();

      expect(result.map((a) => a.id)).toEqual([allowed.id]);
    });

    it("excludes inactive accounts", async () => {
      await createAccount({ userIds: [userId], isActive: false });

      const result = await caller.getAllowed();

      expect(result).toEqual([]);
    });

    it("returns an empty list when the user has no permissions", async () => {
      await createAccount();

      expect(await caller.getAllowed()).toEqual([]);
    });
  });

  describe("remove", () => {
    it("rejects deleting an account that has conversations", async () => {
      const account = await createAccount();
      await db.conversation.create({
        data: { emailAccountId: account.id, contactEmail: "alice@example.com" },
      });

      await expect(caller.remove({ id: account.id })).rejects.toThrow();

      expect(
        await db.emailAccount.findUnique({ where: { id: account.id } }),
      ).not.toBeNull();
    });

    it("deletes an account without conversations and cascades permissions", async () => {
      const member = await createUser();
      const account = await createAccount({ userIds: [member.id] });

      await caller.remove({ id: account.id });
      accountIds.splice(accountIds.indexOf(account.id), 1);

      expect(
        await db.emailAccount.findUnique({ where: { id: account.id } }),
      ).toBeNull();
      expect(
        await db.emailAccountUserPermission.count({
          where: { emailAccountId: account.id },
        }),
      ).toBe(0);
    });

    it("throws NOT_FOUND for an unknown account", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns accounts with their permission assignments and conversation counts", async () => {
      const member = await createUser();
      const account = await createAccount({ userIds: [member.id] });
      await db.conversation.create({
        data: { emailAccountId: account.id, contactEmail: "alice@example.com" },
      });

      const result = await caller.getMany();
      const match = result.find((a) => a.id === account.id);

      expect(match).toBeDefined();
      expect(match!.userPermissions.map((p) => p.userId)).toEqual([member.id]);
      expect(match!._count.conversations).toBe(1);
    });
  });
});
