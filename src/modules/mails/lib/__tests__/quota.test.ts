import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import { getEmailsSentToday, getTodayEmailsAvailable } from "../mail";

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
  await db.emailAccount.deleteMany({});
}

async function seedConversationWithMessages(directions: ("INBOUND" | "OUTBOUND")[]) {
  const account = await db.emailAccount.create({
    data: {
      name: "Support",
      email: `support-${randomUUID()}@example.com`,
    },
  });
  const conversation = await db.conversation.create({
    data: {
      emailAccountId: account.id,
      contactEmail: `contact-${randomUUID()}@example.com`,
    },
  });

  for (const direction of directions) {
    await db.emailMessage.create({
      data: {
        conversationId: conversation.id,
        direction,
        status: direction === "OUTBOUND" ? "SENT" : "RECEIVED",
        fromAddress: "contact@example.com",
        toAddresses: [account.email],
        ccAddresses: [],
        bccAddresses: [],
        sentAt: new Date(),
      },
    });
  }

  return conversation;
}

describe("transactional email quota", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("counts transactional send logs recorded today", async () => {
    await db.emailSendLog.create({
      data: {
        to: "reader@example.com",
        from: "sender@example.com",
        subject: "Order confirmed",
        type: "order_confirmation",
      },
    });

    expect(await getEmailsSentToday()).toBe(1);
  });

  it("counts outbound one-to-one messages but not inbound ones", async () => {
    await seedConversationWithMessages(["INBOUND", "OUTBOUND", "OUTBOUND"]);

    expect(await getEmailsSentToday()).toBe(2);
  });

  it("does not count marketing broadcasts (SingleSends)", async () => {
    await db.emailSingleSend.create({
      data: { name: "Monthly newsletter", subject: "News", bodyHtml: "<p>Hi</p>" },
    });

    expect(await getEmailsSentToday()).toBe(0);
  });

  it("reports the remaining quota as the limit minus today's sends", async () => {
    await db.emailSetting.create({ data: { maxEmailsPerDay: 5 } });
    await seedConversationWithMessages(["OUTBOUND", "OUTBOUND"]);

    expect(await getTodayEmailsAvailable()).toBe(3);
  });

  it("treats an unset limit as unlimited", async () => {
    await db.emailSetting.create({ data: {} });
    await seedConversationWithMessages(["OUTBOUND"]);

    expect(await getTodayEmailsAvailable()).toBe(Number.POSITIVE_INFINITY);
  });
});
