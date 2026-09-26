import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { AutomationNodeError } from "@/modules/automations/lib/node-registry";

import type { GenericEmail } from "../../../lib/types";
import {
  automationEmailIdempotencyKey,
  createAutomationMailEffect,
} from "../mail-effect";

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
}

async function seedSettings() {
  await db.emailSetting.create({
    data: {
      emailSender: "sender@example.com",
      emailProvider: EmailProvider.RESEND,
      emailApiKey: "test-key",
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

const request = {
  config: {
    recipient: "reader@example.com",
    subject: "Welcome",
    body: "<p>Welcome</p>",
  },
  input: { email: "reader@example.com" },
  payload: { email: "reader@example.com" },
  runId: "run-1",
  stepId: "step-1",
};

describe("automationEmailIdempotencyKey", () => {
  it("is stable per run and step", () => {
    expect(automationEmailIdempotencyKey("run-1", "step-1")).toBe(
      "automation:run-1:step-1",
    );
  });
});

describe("createAutomationMailEffect", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("maps the node config onto the mail pipeline with the Step key", async () => {
    await seedSettings();
    const { calls, transport } = recorder();
    const effect = createAutomationMailEffect({ transport });

    const output = await effect(request);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      to: "reader@example.com",
      subject: "Welcome",
      html: "<p>Welcome</p>",
      idempotencyKey: "automation:run-1:step-1",
    });
    expect(output).toMatchObject({
      to: "reader@example.com",
      subject: "Welcome",
      sent: true,
      skipped: false,
    });
  });

  it("does not send twice for a retried Step", async () => {
    await seedSettings();
    const { calls, transport } = recorder();
    const effect = createAutomationMailEffect({ transport });

    await effect(request);
    const second = await effect(request);

    expect(calls).toHaveLength(1);
    expect(second).toMatchObject({ sent: false, skipped: true });
  });

  it("reports transient provider failures as retryable node errors", async () => {
    await seedSettings();
    const effect = createAutomationMailEffect({
      transport: async () => {
        throw new Error("provider unavailable");
      },
    });

    await expect(effect(request)).rejects.toMatchObject({
      name: "AutomationNodeError",
      transient: true,
    });
    await expect(effect(request)).rejects.toBeInstanceOf(AutomationNodeError);
  });

  it("fails permanently when the request has no recipient", async () => {
    await seedSettings();
    const effect = createAutomationMailEffect({ transport: async () => true });

    await expect(
      effect({ ...request, config: { subject: "S", body: "B" } }),
    ).rejects.toMatchObject({ transient: false });
  });
});
