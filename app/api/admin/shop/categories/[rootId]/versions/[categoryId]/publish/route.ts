import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@/prisma/generated/client";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ rootId: string; categoryId: string }> }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, categoryId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.productCategory.findFirst({
      where: {
        id: categoryId,
        rootId,
      },
    });

    if (!category) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!category.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    await db.productCategory.updateMany({
      where: { rootId: rootId },
      data: { isLatest: false },
    });

    const publishedCategory = await db.productCategory.update({
      where: { id: categoryId },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        firstPublishedAt: category.version === 1 ? new Date() : undefined,
        publishedAt: new Date(),
      },
      include: {
        seo: true,
      },
    });

    return NextResponse.json(publishedCategory);
  } catch (error) {
    console.log("[PRODUCT_CATEGORIES_VERSIONS_ROOT_ID_CATEGORY_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
