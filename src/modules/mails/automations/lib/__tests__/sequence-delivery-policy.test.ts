import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AutomationEffect } from "@/modules/automations/lib/effects";
import type { JsonValue } from "@/modules/automations/lib/graph";
import { db } from "@/shared/lib/db";

import { createSequenceDeliveryPolicy } from "../sequence-delivery-policy";

/** In-memory inner effect: records every request it receives. */
function recorder() {
  const calls: JsonValue[] = [];
  const inner: AutomationEffect = async (request) => {
    calls.push(request);
    return { sent: true, skipped: false };
  };
  return { calls, inner };
}

const request = {
  config: {
    recipient: "reader@example.com",
    subject: "Welcome",
    body: "<p>Welcome</p>",
  },
  input: { email: "reader@example.com" },
  payload: { email: "reader@example.com" },
  run: { id: "run-1", triggerType: "manual" },
  step: { id: "step-1", attempts: 0 },
};

async function createContact(email: string, isSubscriber: boolean) {
  return db.emailContact.create({ data: { email, isSubscriber } });
}

describe("createSequenceDeliveryPolicy", () => {
  beforeEach(async () => {
    await db.emailContact.deleteMany({});
  });

  afterEach(async () => {
    await db.emailContact.deleteMany({});
  });

  it("skips the send without calling the inner effect when consent is revoked", async () => {
    await createContact("reader@example.com", false);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    const output = await policy(request);

    expect(calls).toHaveLength(0);
    expect(output).toEqual({ sent: false, skipped: true });
  });

  it("delegates to the inner effect when consent is present", async () => {
    await createContact("reader@example.com", true);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    const output = await policy(request);

    expect(calls).toHaveLength(1);
    expect(output).toEqual({ sent: true, skipped: false });
  });

  it("delegates when the recipient is not a contact", async () => {
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    expect(calls).toHaveLength(1);
  });

  it("delegates when the request has no valid recipient", async () => {
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy({ ...request, config: { subject: "S", body: "B" } });

    expect(calls).toHaveLength(1);
  });

  it("passes the request through unchanged", async () => {
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    expect(calls[0]).toEqual(request);
  });
});
