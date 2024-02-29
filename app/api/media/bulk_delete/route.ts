import { authAdmin } from "@/lib/auth-service";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const media = await db.media.deleteMany({
      where: {
        id: { in: values },
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.log("[MEDIA_BULK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
