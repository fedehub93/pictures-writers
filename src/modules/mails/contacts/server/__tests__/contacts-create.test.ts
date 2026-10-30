import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

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

// The create mutation propagates to the email provider after the insert; the
// provider call is not what this test exercises.
vi.mock("@/modules/mails/lib/core", () => ({
  syncContactWithProvider: vi.fn(),
  propagateContactCreate: vi.fn(async () => ({})),
  propagateContactUpdate: vi.fn(async () => ({})),
  deleteContactOnProvider: vi.fn(),
}));

import { createCallerFactory } from "@/trpc/init";
import { db } from "@/shared/lib/db";

import { contactsRouter } from "../procedures";

const createCaller = createCallerFactory(contactsRouter);
const caller = createCaller({} as never);

const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `admin-${randomUUID()}@example.com`;
  createdEmails.push(email);
  return email;
}

const contactInput = (email: string) => ({
  email,
  firstName: null,
  lastName: null,
  audiences: [],
  interactions: [],
  isSubscriber: true,
});

afterEach(async () => {
  if (createdEmails.length > 0) {
    await db.emailContact.deleteMany({
      where: { email: { in: createdEmails, mode: "insensitive" } },
    });
  }
  createdEmails.length = 0;
});

describe("contacts.create", () => {
  it("rejects an existing address with a case difference and creates no row", async () => {
    const email = uniqueEmail();
    await db.emailContact.create({
      data: { email: `Admin-${email.slice("admin-".length)}` },
    });

    await expect(caller.create(contactInput(email))).rejects.toMatchObject({
      code: "CONFLICT",
      message: "A contact with this email already exists.",
    });

    expect(
      await db.emailContact.count({
        where: { email: { equals: email, mode: "insensitive" } },
      }),
    ).toBe(1);
  });

  it("stores the canonical form when the address is new", async () => {
    const email = uniqueEmail();

    const created = await caller.create(
      contactInput(email.toUpperCase()),
    );

    expect(created.email).toBe(email);
  });
});
