import { SocialChannel, SocialEntityType } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { SettingsWithScriptsAndSocials } from "@/types";
import { DEFAULT_SOCIAL_CHANNEL_VALUES } from "@/constants";

export const getSettings = async () => {
  const settings = await db.settings.findFirst({
    include: {
      seo: true,
    },
  });

  if (!settings) {
    const settings = await db.settings.create({
      data: {
        siteName: "Pictures Writers",
      },
    });

    const seoSettings = await db.seo.create({
      data: {
        title: "Pictures Writers",
        version: 1,
      },
    });

    const updatedSettings = await db.settings.update({
      where: { id: settings.id },
      data: {
        seoId: seoSettings.id,
      },
      include: {
        seo: true,
      },
    });

    const socials = await getSocials(settings.id);
    const mappedSettings: SettingsWithScriptsAndSocials = {
      ...updatedSettings,
      socials: [...socials],
      siteShopUrl: `${settings.siteUrl}/shop`,
    };

    return mappedSettings;
  }

  const socials = await getSocials(settings.id);
  const mappedSettings: SettingsWithScriptsAndSocials = {
    ...settings,
    socials: [...socials],
    siteShopUrl: `${settings.siteUrl}/shop`,
  };

  return mappedSettings;
};

const getSocials = async (settingsId: string) => {
  let socials: SocialChannel[] = [];
  socials = await db.socialChannel.findMany({
    where: {
      entityType: SocialEntityType.SITE,
      entityId: settingsId,
    },
  });

  if (socials && socials.length > 0) {
    return socials;
  }

  socials = [];
  for (const channel of DEFAULT_SOCIAL_CHANNEL_VALUES) {
    const socialSettings = await db.socialChannel.create({
      data: {
        key: channel.key,
        url: channel.url,
        entityType: SocialEntityType.SITE,
        entityId: settingsId,
      },
    });
    socials.push(socialSettings);
  }

  return socials;
};
