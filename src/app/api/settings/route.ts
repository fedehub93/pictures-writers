import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { SettingsScripts } from "@/types";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import {
  MEDIA_QUOTA_DEFAULT_MB,
  PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
  parseMediaQuotaMb,
  parsePublicOriginReserveMb,
} from "@/modules/media/lib/quota";
import { parseStorageDriver } from "@/modules/media/lib/storage-driver";
import { isUploadThingConfigured } from "@/modules/media/server/storage";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data: Record<string, unknown> = { ...values };

    if (values.mediaQuotaMb !== undefined) {
      const quotaMb = parseMediaQuotaMb(values.mediaQuotaMb);

      if (quotaMb === null) {
        return NextResponse.json(
          {
            error:
              "The media quota must be a whole number of megabytes, at least 1.",
          },
          { status: 400 },
        );
      }

      data.mediaQuotaMb = quotaMb;
    }

    if (values.publicOriginReserveMb !== undefined) {
      const reserveMb = parsePublicOriginReserveMb(
        values.publicOriginReserveMb,
      );

      if (reserveMb === null) {
        return NextResponse.json(
          {
            error:
              "The public-origin reserve must be a whole number of megabytes, zero or more.",
          },
          { status: 400 },
        );
      }

      data.publicOriginReserveMb = reserveMb;
    }

    if (values.storageDriver !== undefined) {
      const storageDriver = parseStorageDriver(values.storageDriver);

      if (storageDriver === null) {
        return NextResponse.json(
          { error: 'The storage driver must be "local" or "uploadthing".' },
          { status: 400 },
        );
      }

      if (storageDriver === "uploadthing" && !isUploadThingConfigured()) {
        return NextResponse.json(
          {
            error:
              "UploadThing cannot be selected while UPLOADTHING_TOKEN is not configured.",
          },
          { status: 400 },
        );
      }

      data.storageDriver = storageDriver;
    }

    if (Array.isArray(values.scripts)) {
      data.scripts = values.scripts.map((v: SettingsScripts) => ({
        ...v,
        content: v.content?.trim(),
      }));
    }

    const current = await db.settings.findFirst({
      select: { mediaQuotaMb: true, publicOriginReserveMb: true },
    });
    const quotaMb =
      typeof data.mediaQuotaMb === "number"
        ? data.mediaQuotaMb
        : (current?.mediaQuotaMb ?? MEDIA_QUOTA_DEFAULT_MB);
    const reserveMb =
      typeof data.publicOriginReserveMb === "number"
        ? data.publicOriginReserveMb
        : (current?.publicOriginReserveMb ?? PUBLIC_ORIGIN_RESERVE_DEFAULT_MB);

    if (reserveMb > quotaMb) {
      return NextResponse.json(
        {
          error:
            "The public-origin reserve must not exceed the storage quota: it is a share held inside the quota.",
        },
        { status: 400 },
      );
    }

    const updatedSettings = await db.settings.updateMany({
      data,
    });

    revalidateContent("settings");

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.log("[SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
