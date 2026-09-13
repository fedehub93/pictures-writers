import { describe, expect, it } from "vitest";

import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  isInvitationUsable,
  withoutInvitationTokenHash,
} from "./invitation-token";

describe("invitation tokens", () => {
  it("creates a token whose hash can be stored instead of the token", () => {
    const result = createInvitationToken();

    expect(result.token).toHaveLength(43);
    expect(result.tokenHash).toBe(hashInvitationToken(result.token));
    expect(result.tokenHash).not.toContain(result.token);
  });

  it("expires invitations after 72 hours", () => {
    const now = new Date("2026-09-13T12:00:00.000Z");

    expect(invitationExpiry(now).toISOString()).toBe("2026-09-16T12:00:00.000Z");
  });

  it("only accepts pending, unexpired invitations", () => {
    const now = new Date("2026-09-13T12:00:00.000Z");
    const invitation = { status: "PENDING" as const, expiresAt: invitationExpiry(now) };

    expect(isInvitationUsable(invitation, now)).toBe(true);
    expect(isInvitationUsable({ ...invitation, status: "CANCELLED" }, now)).toBe(false);
    expect(isInvitationUsable({ ...invitation, expiresAt: now }, now)).toBe(false);
  });

  it("removes token hashes from invitation responses", () => {
    expect(withoutInvitationTokenHash({ id: "invitation-1", tokenHash: "secret" })).toEqual({
      id: "invitation-1",
    });
  });
});
