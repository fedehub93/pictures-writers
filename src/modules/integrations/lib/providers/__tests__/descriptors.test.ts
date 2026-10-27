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
});
