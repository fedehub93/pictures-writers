import { describe, expect, it } from "vitest";

import { INTEGRATION_PROVIDERS } from "../../constants";
import {
  INTEGRATION_DESCRIPTORS,
  getIntegrationDescriptor,
  getIntegrationSecretPresence,
  parseIntegrationConfig,
} from "..";

describe("integration provider descriptors", () => {
  it("describes every known provider", () => {
    expect(Object.keys(INTEGRATION_DESCRIPTORS).sort()).toEqual(
      [...INTEGRATION_PROVIDERS].sort(),
    );
  });

  it("summarises secret presence without exposing secret values", () => {
    const descriptor = getIntegrationDescriptor("resend");

    const presence = getIntegrationSecretPresence(descriptor, ["apiKey"]);

    expect(presence).toEqual([
      {
        key: "apiKey",
        label: "API key",
        required: true,
        present: true,
      },
      {
        key: "webhookSecret",
        label: "Webhook secret",
        required: false,
        present: false,
      },
    ]);
    expect(JSON.stringify(presence)).not.toContain("apiKey-value");
  });

  it("reads configuration through the provider's own schema", () => {
    const descriptor = getIntegrationDescriptor("resend");

    expect(parseIntegrationConfig(descriptor, { unexpected: "value" })).toEqual(
      {},
    );
  });

  it("describes Iubenda as a public provider without credentials or a test", () => {
    const descriptor = getIntegrationDescriptor("iubenda");

    expect(descriptor.presentation.name).toBe("Iubenda");
    expect(descriptor.secretFields).toEqual([]);
    expect(descriptor.secretsSchema).toBeUndefined();
    expect(descriptor.connectionTest).toBeUndefined();
    expect(descriptor.affectsPublicSite).toBe(true);
  });

  it("validates Iubenda identifiers and defaults the boolean options", () => {
    const descriptor = getIntegrationDescriptor("iubenda");

    const parsed = descriptor.configSchema.parse({
      siteId: "3303495",
      cookiePolicyId: "123456",
      lang: "it",
    });

    expect(parsed).toEqual({
      siteId: "3303495",
      cookiePolicyId: "123456",
      lang: "it",
      autoblocking: true,
      consentMode: true,
    });

    expect(
      descriptor.configSchema.safeParse({
        siteId: "not-a-number",
        cookiePolicyId: "123456",
        lang: "it",
      }).success,
    ).toBe(false);
    expect(
      descriptor.isReady({
        config: { siteId: "3303495" },
        secretKeys: [],
      }),
    ).toBe(false);
  });
});
