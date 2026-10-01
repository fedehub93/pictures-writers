import { describe, expect, it } from "vitest";

import {
  MissingSendEmailConfigError,
  resolveSendEmailConfig,
} from "../send-email-config";

const context = {
  input: { email: "reader@example.com", name: "Ada" },
  payload: { email: "reader@example.com", name: "Ada" },
  run: { id: "run-1", triggerType: "manual" },
  step: { id: "step-1", attempts: 0 },
};

describe("resolveSendEmailConfig", () => {
  it("interpolates template expressions from payload and input", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "{{ payload.email }}",
        subject: "Hello {{ input.name }}",
        body: "<p>Hi {{ payload.name }}, welcome.</p>",
      },
      context,
    );

    expect(config).toEqual({
      recipient: "reader@example.com",
      subject: "Hello Ada",
      body: "<p>Hi Ada, welcome.</p>",
      from: undefined,
      replyTo: undefined,
    });
  });

  it("carries the optional from and replyTo through", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "other@example.com",
        subject: "Subject",
        body: "<p>Body</p>",
        from: "Custom <custom@example.com>",
        replyTo: "reply@example.com",
      },
      context,
    );

    expect(config).toEqual({
      recipient: "other@example.com",
      subject: "Subject",
      body: "<p>Body</p>",
      from: "Custom <custom@example.com>",
      replyTo: "reply@example.com",
    });
  });

  it("interpolates the preview text", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "reader@example.com",
        subject: "Subject",
        previewText: "Hi {{ payload.name }}",
        body: "<p>Body</p>",
      },
      context,
    );

    expect(config.previewText).toBe("Hi Ada");
  });

  it("omits a blank preview text", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "reader@example.com",
        subject: "Subject",
        previewText: "   ",
        body: "<p>Body</p>",
      },
      context,
    );

    expect(config.previewText).toBeUndefined();
  });

  it("leaves a whole-string expression as the typed value", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "{{ payload.email }}",
        subject: "Subject",
        body: "Body",
      },
      context,
    );

    expect(config.recipient).toBe("reader@example.com");
  });

  it("throws when the recipient is missing", () => {
    expect(() =>
      resolveSendEmailConfig({ subject: "S", body: "B" }, context),
    ).toThrow(MissingSendEmailConfigError);
  });

  it("throws when the subject is missing", () => {
    expect(() =>
      resolveSendEmailConfig({ recipient: "a@b.com", body: "B" }, context),
    ).toThrow(MissingSendEmailConfigError);
  });

  it("throws when the body is missing", () => {
    expect(() =>
      resolveSendEmailConfig({ recipient: "a@b.com", subject: "S" }, context),
    ).toThrow(MissingSendEmailConfigError);
  });

  it("accepts an email template in place of an inline body", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "reader@example.com",
        subject: "Subject",
        emailTemplateId: "template-1",
      },
      context,
    );

    expect(config).toEqual({
      recipient: "reader@example.com",
      subject: "Subject",
      emailTemplateId: "template-1",
    });
    expect(config.body).toBeUndefined();
  });

  it("interpolates an email template id", () => {
    const config = resolveSendEmailConfig(
      {
        recipient: "reader@example.com",
        subject: "Subject",
        emailTemplateId: "{{ payload.templateId }}",
      },
      {
        ...context,
        payload: { templateId: "template-42" },
      },
    );

    expect(config.emailTemplateId).toBe("template-42");
  });
});
