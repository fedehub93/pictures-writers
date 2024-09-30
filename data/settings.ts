import { db } from "@/lib/db";

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

    return updatedSettings;
  }

  return settings;
};
