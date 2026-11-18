import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { SettingsScripts } from "@/types";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { parseMediaQuotaMb } from "@/modules/media/lib/quota";
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
