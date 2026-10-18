import { describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";

import { PROVIDER_SETUP_GUIDES } from "../provider-guides";

describe("provider setup guides", () => {
  it("covers every provider in the catalog", () => {
    expect(Object.keys(PROVIDER_SETUP_GUIDES).sort()).toEqual(
      Object.values(EmailProvider).sort(),
    );
  });

  it("has no guide yet for providers that are not integrated", () => {
    expect(PROVIDER_SETUP_GUIDES.SENDGRID).toBeNull();
  });

  it("tells the admin everything Resend requires for send and receive", () => {
    const guide = PROVIDER_SETUP_GUIDES.RESEND;
    expect(guide).not.toBeNull();

    const text = JSON.stringify(guide);
    expect(text).toContain("email.received");
    expect(text).toContain("/api/webhooks/resend/");
    expect(text).toContain("Settings → Integrations");
    expect(text).toContain("signing secret");
    expect(text).toMatch(/receiving/i);
    expect(text).toMatch(/MX/);
  });
});
