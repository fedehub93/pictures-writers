import { describe, expect, it } from "vitest";

import { hashWebhookSecret, verifyWebhookSecret } from "../webhook-secret";

describe("webhook secret", () => {
  it("hashes a secret to a deterministic sha256 hex digest", () => {
    const hash = hashWebhookSecret("super-secret");

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashWebhookSecret("super-secret")).toBe(hash);
  });

  it("verifies a secret against its stored hash", () => {
    const stored = hashWebhookSecret("super-secret");

    expect(verifyWebhookSecret("super-secret", stored)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    const stored = hashWebhookSecret("super-secret");

    expect(verifyWebhookSecret("wrong-secret", stored)).toBe(false);
  });

  it("rejects missing inputs", () => {
    const stored = hashWebhookSecret("super-secret");

    expect(verifyWebhookSecret(null, stored)).toBe(false);
    expect(verifyWebhookSecret("super-secret", null)).toBe(false);
    expect(verifyWebhookSecret("", stored)).toBe(false);
  });

  it("rejects a malformed stored hash instead of throwing", () => {
    expect(verifyWebhookSecret("super-secret", "not-a-hash")).toBe(false);
    expect(verifyWebhookSecret("super-secret", "a".repeat(63))).toBe(false);
  });
});
