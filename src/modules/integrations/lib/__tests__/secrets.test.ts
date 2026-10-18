import { describe, expect, it } from "vitest";

import { applySecretsUpdate } from "../secrets";

describe("applySecretsUpdate", () => {
  it("keeps the current value when a field is absent from the update", () => {
    const current = { apiKey: "current-key", webhookSecret: "current-secret" };

    const updated = applySecretsUpdate(current, {});

    expect(updated).toEqual(current);
  });

  it("replaces the current value with a non-empty string", () => {
    const current = { apiKey: "current-key", webhookSecret: "current-secret" };

    const updated = applySecretsUpdate(current, { apiKey: "new-key" });

    expect(updated.apiKey).toBe("new-key");
    expect(updated.webhookSecret).toBe("current-secret");
  });

  it("removes the secret when the update value is null", () => {
    const current = { apiKey: "current-key", webhookSecret: "current-secret" };

    const updated = applySecretsUpdate(current, { webhookSecret: null });

    expect(updated.apiKey).toBe("current-key");
    expect(updated.webhookSecret).toBeUndefined();
  });

  it("keeps the current value when the update value is undefined", () => {
    const current = { apiKey: "current-key", webhookSecret: "current-secret" };

    const updated = applySecretsUpdate(current, { webhookSecret: undefined });

    expect(updated).toEqual(current);
  });

  it("keeps the current value when the update value is an empty string", () => {
    const current = { apiKey: "current-key", webhookSecret: "current-secret" };

    const updated = applySecretsUpdate(current, { webhookSecret: "" });

    expect(updated).toEqual(current);
  });
});
