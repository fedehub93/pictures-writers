import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { getSettings } from "@/data/settings";
import { SocialChannel, SocialEntityType } from "@prisma/client";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: settingsId, socials } = await getSettings();

    if (!socials || socials.length === 0) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    await db.socialChannel.deleteMany({
      where: {
        entityType: SocialEntityType.SITE,
      },
    });

    const updatedSocials: SocialChannel[] = [];
    for (const social of values.socials) {
      const updatedSocial = await db.socialChannel.create({
        data: {
          key: social.key,
          url: social.url,
          entityType: SocialEntityType.SITE,
          entityId: settingsId,
        },
      });
      updatedSocials.push(updatedSocial);
    }

    return NextResponse.json(updatedSocials);
  } catch (error) {
    console.log("[SETTINGS_SOCIALS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
