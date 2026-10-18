import { describe, expect, it } from "vitest";

import { INTEGRATION_PROVIDERS } from "../constants";
import { PROVIDER_SETUP_GUIDES } from "../provider-guides";

describe("provider setup guides", () => {
  it("covers every integration provider in the catalog", () => {
    expect(Object.keys(PROVIDER_SETUP_GUIDES).sort()).toEqual(
      [...INTEGRATION_PROVIDERS].sort(),
    );
  });

  it("tells the admin everything Resend requires for send and receive", () => {
    const guide = PROVIDER_SETUP_GUIDES.resend;
    expect(guide).not.toBeNull();

    const text = JSON.stringify(guide);
    expect(text).toContain("email.received");
    expect(text).toContain("/api/webhooks/resend/");
    expect(text).toContain("Integrations");
    expect(text).toContain("signing secret");
    expect(text).toMatch(/receiving/i);
    expect(text).toMatch(/MX/);
  });
});
