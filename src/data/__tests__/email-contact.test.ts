import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  createContactByEmail,
  getContactByEmail,
} from "@/data/email-contact";
import { db } from "@/shared/lib/db";

const createdEmails: string[] = [];

function uniqueEmail(localPrefix = "contact"): string {
  const email = `${localPrefix}-${randomUUID()}@example.com`;
  createdEmails.push(email, email.toLowerCase(), email.toUpperCase());
  return email;
}

async function createLegacyContact(email: string, createdAt?: Date) {
  return db.emailContact.create({
    data: { email, isSubscriber: true, createdAt },
  });
}

afterEach(async () => {
  if (createdEmails.length > 0) {
    await db.emailContact.deleteMany({
      where: {
        email: {
          in: [...new Set(createdEmails)],
          mode: "insensitive",
        },
      },
    });
  }
  createdEmails.length = 0;
});

describe("getContactByEmail", () => {
  it("finds a legacy non-canonical row and does not create a canonical twin", async () => {
    const canonical = uniqueEmail("legacy");
    const legacySpelling = canonical.replace("legacy-", "Legacy-");
    const legacy = await createLegacyContact(legacySpelling);

    const contact = await createContactByEmail(canonical);

    expect(contact?.id).toBe(legacy.id);
    // This is the test protecting the "no backfill" decision: removing the
    // insensitive lookup must break it.
    expect(
      await db.emailContact.count({
        where: { email: { equals: canonical, mode: "insensitive" } },
      }),
    ).toBe(1);
  });

  it("returns the oldest row when a legacy pair both matches", async () => {
    const canonical = uniqueEmail("pair");
    const legacySpelling = canonical.replace("pair-", "Pair-");

    const oldest = await createLegacyContact(
      legacySpelling,
      new Date("2020-01-01T00:00:00.000Z"),
    );
    const newest = await createLegacyContact(
      canonical,
      new Date("2021-01-01T00:00:00.000Z"),
    );

    const firstRead = await getContactByEmail(canonical.toUpperCase());
    const secondRead = await getContactByEmail(canonical);

    expect(firstRead?.id).toBe(oldest.id);
    expect(secondRead?.id).toBe(oldest.id);
    expect(firstRead?.id).not.toBe(newest.id);
  });

  it("returns null for an empty address", async () => {
    expect(await getContactByEmail("")).toBeNull();
    expect(await getContactByEmail("   ")).toBeNull();
  });
});

describe("createContactByEmail", () => {
  it("writes the canonical form", async () => {
    const email = uniqueEmail("canonical");

    const contact = await createContactByEmail(
      `  ${email.toUpperCase()}  `,
    );

    expect(contact?.email).toBe(email.toLowerCase());
  });

  it("does not create a contact when the address is null or empty", async () => {
    const before = await db.emailContact.count();

    expect(await createContactByEmail(null)).toBeNull();
    expect(await createContactByEmail("   ")).toBeNull();

    expect(await db.emailContact.count()).toBe(before);
  });

  it("survives two concurrent captures with a single row", async () => {
    const email = uniqueEmail("race");

    const [first, second] = await Promise.all([
      createContactByEmail(email),
      createContactByEmail(email),
    ]);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.id).toBe(second?.id);
    expect(
      await db.emailContact.count({
        where: { email: { equals: email, mode: "insensitive" } },
      }),
    ).toBe(1);
  });
});
