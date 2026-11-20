import { SocialEntityType } from "@/generated/prisma";

import { db } from "@/lib/db";
import { SettingsWithScriptsAndSocials } from "@/types";
import { DEFAULT_SOCIAL_CHANNEL_VALUES } from "@/constants";

/**
 * One advisory-lock key for the one-time Installation bootstrap. `next build`
 * prerenders several pages with more than one worker, and more than one of them
 * can find no settings row at the same moment; the lock makes the second reader
 * see the first one's row instead of creating a second Installation. The lock
 * is transaction-scoped, so it is released when the bootstrap ends.
 */
const SETTINGS_BOOTSTRAP_LOCK_KEY = 0x53455453; // "SETS"

export const getSettings = async (): Promise<SettingsWithScriptsAndSocials> => {
  const settings =
    (await db.settings.findFirst({ include: { seo: true } })) ??
    (await createDefaultSettings());

  const socials = await getSocials(settings.id);

  return {
    ...settings,
    socials: [...socials],
    siteShopUrl: `${settings.siteUrl}/shop`,
  };
};

/**
 * Creates the Installation's settings and SEO rows once. The second read under
 * the lock is what makes a concurrent bootstrap converge: the worker that lost
 * the race returns the winner's rows instead of inserting a duplicate.
 */
const createDefaultSettings = async () => {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETTINGS_BOOTSTRAP_LOCK_KEY})`;

    const existing = await tx.settings.findFirst({ include: { seo: true } });

    if (existing) {
      return existing;
    }

    const settings = await tx.settings.create({
      data: {
        siteName: "Pictures Writers",
      },
    });

    const seoSettings = await tx.seo.create({
      data: {
        title: "Pictures Writers",
        version: 1,
      },
    });

    return tx.settings.update({
      where: { id: settings.id },
      data: {
        seoId: seoSettings.id,
      },
      include: {
        seo: true,
      },
    });
  });
};

const getSocials = async (settingsId: string) => {
  const where = { entityType: SocialEntityType.SITE, entityId: settingsId };

  const existing = await db.socialChannel.findMany({ where });

  if (existing.length > 0) {
    return existing;
  }

  // `skipDuplicates` makes a concurrent insert a no-op, so two workers that
  // both found no channels write one set between them instead of failing on
  // the (key, entityId, entityType) unique constraint.
  await db.socialChannel.createMany({
    data: DEFAULT_SOCIAL_CHANNEL_VALUES.map((channel) => ({
      key: channel.key,
      url: channel.url,
      entityType: SocialEntityType.SITE,
      entityId: settingsId,
    })),
    skipDuplicates: true,
  });

  return db.socialChannel.findMany({ where });
};
