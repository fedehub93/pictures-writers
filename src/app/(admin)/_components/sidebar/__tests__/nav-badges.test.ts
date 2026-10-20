import { describe, expect, it } from "vitest";

import { getNavBadges } from "../nav-badges";

describe("getNavBadges", () => {
  it("carries the unread total for users who can read mail", () => {
    expect(getNavBadges(["mail.read"], 4)).toEqual({ "mail-unread": 4 });
  });

  it("drops the badge for users who cannot read mail", () => {
    expect(getNavBadges(["dashboard.read"], 4)).toEqual({});
    expect(getNavBadges([], 4)).toEqual({});
  });

  it("passes a zero or absent total through for the badge to hide", () => {
    expect(getNavBadges(["mail.read"], 0)).toEqual({ "mail-unread": 0 });
    expect(getNavBadges(["mail.read"], undefined)).toEqual({
      "mail-unread": undefined,
    });
  });
});
