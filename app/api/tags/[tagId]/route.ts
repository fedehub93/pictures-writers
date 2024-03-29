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

    const tag = await db.tag.update({
      where: {
        id: tagId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAG_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
