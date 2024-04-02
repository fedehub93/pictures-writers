import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const user = await authAdmin();
    const { tagId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.findUnique({
      where: {
        id: tagId,
      },
    });

    if (!tag) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedTag = await db.tag.update({
      where: {
        id: tagId,
      },
      data: {
        isPublished: false,
      },
    });

    return NextResponse.json(unpublishedTag);
  } catch (error) {
    console.log("[TAG_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
