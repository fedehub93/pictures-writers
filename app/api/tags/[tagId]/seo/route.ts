import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const user = await authAdmin();
    const { tagId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const seo = await db.seo.updateMany({
      where: {
        tag: { id: tagId },
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(seo);
  } catch (error) {
    console.log("[TAG_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
