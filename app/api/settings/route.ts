import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { SettingsScripts } from "@/types";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let scripts = [];
    if (values.scripts && values.scripts.length > 0) {
      scripts = values.scripts.map((v: SettingsScripts) => ({
        ...v,
        content: v.content?.trim(),
      }));
    }

    const updatedSettings = await db.settings.updateMany({
      data: {
        ...values,
        scripts,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.log("[SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
