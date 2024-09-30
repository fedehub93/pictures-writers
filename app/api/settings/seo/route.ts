import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { getSettings } from "@/data/settings";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { seo } = await getSettings();

    if (!seo) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedSettings = await db.seo.update({
      where: { id: seo.id },
      data: { ...values },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.log("[SETTINGS_SEO_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
