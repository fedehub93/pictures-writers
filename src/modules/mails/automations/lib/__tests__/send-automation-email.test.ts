import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { GenericEmail } from "../../../lib/types";
import {
  AutomationEmailError,
  sendAutomationEmail,
} from "../send-automation-email";

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
}

async function seedSettings() {
  return db.emailSetting.create({
    data: {
      emailSender: "sender@example.com",
      emailSenderName: "Pictures Writers",
      emailProvider: EmailProvider.RESEND,
      emailApiKey: "test-key",
      emailResponse: "reply@example.com",
    },
  });
}

function recorder() {
  const calls: GenericEmail[] = [];
  return {
    calls,
    transport: async (email: GenericEmail) => {
      calls.push(email);
      return true;
    },
  };
}

describe("sendAutomationEmail", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("delivers through the transport and records an audited, idempotent row", async () => {
    await seedSettings();
    const { calls, transport } = recorder();

    const result = await sendAutomationEmail({
      to: "reader@example.com",
      subject: "Welcome",
      body: "<p>Welcome</p>",
      idempotencyKey: "automation:run-1:step-1",
      transport,
    });

    expect(result).toMatchObject({ sent: true, skipped: false });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      to: "reader@example.com",
      from: "Pictures Writers <sender@example.com>",
      replyTo: "reply@example.com",
      subject: "Welcome",
      html: "<p>Welcome</p>",
      idempotencyKey: "automation:run-1:step-1",
    });

    const log = await db.emailSendLog.findUnique({
      where: { idempotencyKey: "automation:run-1:step-1" },
    });
    expect(log).toMatchObject({
      to: "reader@example.com",
      subject: "Welcome",
      type: "automation",
    });
  });

  it("skips a repeated send with the same idempotency key", async () => {
    await seedSettings();
    const { calls, transport } = recorder();

    await sendAutomationEmail({
      to: "reader@example.com",
      subject: "Welcome",
      body: "<p>Welcome</p>",
      idempotencyKey: "automation:run-1:step-1",
      transport,
    });

    const second = await sendAutomationEmail({
      to: "reader@example.com",
      subject: "Welcome",
      body: "<p>Welcome</p>",
      idempotencyKey: "automation:run-1:step-1",
      transport,
    });

    expect(second).toMatchObject({ sent: false, skipped: true });
    expect(calls).toHaveLength(1);
    expect(await db.emailSendLog.count()).toBe(1);
  });

  it("fails permanently when no provider is configured", async () => {
    const { transport } = recorder();

    await expect(
      sendAutomationEmail({
        to: "reader@example.com",
        subject: "Welcome",
        body: "<p>Welcome</p>",
        transport,
      }),
    ).rejects.toMatchObject({ transient: false });
  });

  it("classifies transient transport errors as retryable", async () => {
    await seedSettings();

    await expect(
      sendAutomationEmail({
        to: "reader@example.com",
        subject: "Welcome",
        body: "<p>Welcome</p>",
        transport: async () => {
          throw new Error("network timeout while calling the provider");
        },
      }),
    ).rejects.toMatchObject({ transient: true });
  });

  it("fails permanently when the transport declines the message", async () => {
    await seedSettings();

    await expect(
      sendAutomationEmail({
        to: "reader@example.com",
        subject: "Welcome",
        body: "<p>Welcome</p>",
        transport: async () => false,
      }),
    ).rejects.toBeInstanceOf(AutomationEmailError);
  });

  it("requires a recipient, subject and body", async () => {
    await seedSettings();

    await expect(
      sendAutomationEmail({
        to: "",
        subject: "Welcome",
        body: "<p>Welcome</p>",
        transport: async () => true,
      }),
    ).rejects.toMatchObject({ transient: false });
  });
});
