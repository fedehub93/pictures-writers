import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const user = await authAdmin();
    const { categoryId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedCategory = await db.category.update({
      where: {
        id: categoryId,
      },
      data: { status: ContentStatus.CHANGED },
    });

    return NextResponse.json(unpublishedCategory);
  } catch (error) {
    console.log("[POST_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
