import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AutomationEffect } from "@/modules/automations/lib/effects";
import type { JsonObject, JsonValue } from "@/modules/automations/lib/graph";
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

function forwardedHeaders(call: JsonValue): JsonObject | undefined {
  const record = call as JsonObject;
  const config = record.config as JsonObject;
  return config.headers as JsonObject | undefined;
}

describe("createSequenceDeliveryPolicy", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    await db.emailContact.deleteMany({});
  });

  afterEach(async () => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
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

  it("injects the List-Unsubscribe headers for a contact when the app URL is configured", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    const contact = await createContact("reader@example.com", true);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    const url = `https://app.test/api/newsletter/unsubscribe/?id=${contact.id}`;
    expect(forwardedHeaders(calls[0])).toEqual({
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("normalizes trailing slashes in the configured app URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test///";
    const contact = await createContact("reader@example.com", true);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    expect(forwardedHeaders(calls[0])?.["List-Unsubscribe"]).toBe(
      `<https://app.test/api/newsletter/unsubscribe/?id=${contact.id}>`,
    );
  });

  it("omits the headers without error when the app URL is not configured", async () => {
    await createContact("reader@example.com", true);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    expect(calls).toHaveLength(1);
    expect(forwardedHeaders(calls[0])).toBeUndefined();
  });

  it("omits the headers when the recipient is not a contact", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy(request);

    expect(calls).toHaveLength(1);
    expect(forwardedHeaders(calls[0])).toBeUndefined();
  });

  it("keeps pre-existing config headers when injecting", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    await createContact("reader@example.com", true);
    const { calls, inner } = recorder();
    const policy = createSequenceDeliveryPolicy(inner);

    await policy({
      ...request,
      config: { ...request.config, headers: { "X-Existing": "kept" } },
    });

    expect(forwardedHeaders(calls[0])).toMatchObject({
      "X-Existing": "kept",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });
});
