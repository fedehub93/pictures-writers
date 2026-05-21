import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      mediaId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { mediaId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const asset = await db.media.update({
      where: { id: mediaId },
      data: { ...values },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.log("[MEDIA_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
