import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@/generated/prisma";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ pageId: string }> },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { pageId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const page = await db.page.findUnique({
      where: {
        id: pageId,
      },
    });

    if (!page) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedPage = await db.page.update({
      where: { id: pageId },
      data: { status: ContentStatus.CHANGED },
    });

    return NextResponse.json(unpublishedPage);
  } catch (error) {
    console.log("[PAGE_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
