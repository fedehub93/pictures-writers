import { describe, expect, it } from "vitest";

import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import type { JsonObject } from "@/modules/automations/lib/graph";
import { AutomationNodeError } from "@/modules/automations/lib/node-registry";

import { sendEmailHandler, sendEmailNodeRegistry } from "../node";

function buildContext(
  data: JsonObject = {
    recipient: "{{ payload.email }}",
    subject: "Welcome {{ input.name }}",
    body: "<p>Hi {{ payload.name }}</p>",
  },
) {
  return {
    node: {
      id: "email",
      type: "SEND_EMAIL",
      data,
    },
    input: { email: "reader@example.com", name: "Ada" },
    payload: { email: "reader@example.com", name: "Ada" },
    run: { id: "run-1", triggerType: "manual" },
    step: { id: "step-1", attempts: 0 },
    now: new Date("2026-01-01T00:00:00.000Z"),
    effects: createInMemoryEffects(),
  };
}

describe("sendEmailHandler", () => {
  it("interpolates the config and delegates to the mail effect", async () => {
    const context = buildContext();

    const result = await sendEmailHandler(context);

    expect(context.effects.mailCalls).toHaveLength(1);
    expect(context.effects.mailCalls[0]).toEqual({
      config: {
        recipient: "reader@example.com",
        subject: "Welcome Ada",
        body: "<p>Hi Ada</p>",
      },
      input: { email: "reader@example.com", name: "Ada" },
      payload: { email: "reader@example.com", name: "Ada" },
      run: { id: "run-1", triggerType: "manual" },
      step: { id: "step-1", attempts: 0 },
    });
    expect(result).toEqual({ output: context.effects.mailCalls[0] });
  });

  it("fails permanently when the config is incomplete", async () => {
    const context = buildContext({ subject: "S", body: "B" });

    await expect(sendEmailHandler(context)).rejects.toBeInstanceOf(
      AutomationNodeError,
    );
    expect(context.effects.mailCalls).toHaveLength(0);
  });
});

describe("sendEmailNodeRegistry", () => {
  it("registers the handler under the sendEmail key", () => {
    expect(Object.keys(sendEmailNodeRegistry)).toContain("sendEmail");
  });
});
