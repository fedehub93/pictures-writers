import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { SocialEntityType } from "@/generated/prisma";
import { DEFAULT_SOCIAL_CHANNEL_VALUES } from "@/constants";

import { getSettings } from "../settings";

/**
 * `next build` prerenders pages with more than one worker against a database
 * that has never held an Installation, so the bootstrap is exercised from an
 * empty table: every row these tests read is one a racing render created.
 */
describe("getSettings bootstrap", () => {
  beforeEach(async () => {
    await db.socialChannel.deleteMany({});
    await db.settings.deleteMany({});
  });

  it("creates one Installation when several renders race for it", async () => {
    const rendered = await Promise.all(
      Array.from({ length: 4 }, () => getSettings()),
    );

    const ids = new Set(rendered.map((settings) => settings.id));

    expect(ids.size).toBe(1);
    await expect(db.settings.count()).resolves.toBe(1);
  });

  it("creates the default social channels once when several renders race", async () => {
    const settings = await getSettings();
    await db.socialChannel.deleteMany({ where: { entityId: settings.id } });

    const rendered = await Promise.all(
      Array.from({ length: 4 }, () => getSettings()),
    );

    for (const each of rendered) {
      expect(each.socials.map((social) => social.key).sort()).toEqual(
        DEFAULT_SOCIAL_CHANNEL_VALUES.map((channel) => channel.key).sort(),
      );
    }

    const stored = await db.socialChannel.findMany({
      where: { entityType: SocialEntityType.SITE, entityId: settings.id },
    });

    expect(stored).toHaveLength(DEFAULT_SOCIAL_CHANNEL_VALUES.length);
  });
});
