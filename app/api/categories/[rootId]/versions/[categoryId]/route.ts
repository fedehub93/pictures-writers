import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      categoryId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, categoryId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.category.findFirst({
      where: {
        rootId: rootId,
        id: categoryId,
      },
    });

    if (!category || !category.seoId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedCategory = await db.category.deleteMany({
      where: { rootId },
    });

    await db.seo.delete({
      where: { id: category.seoId },
    });

    return NextResponse.json(deletedCategory);
  } catch (error) {
    console.log("[CATEGORIES_ROOT_ID_VERSIONS_CATEGORY_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      categoryId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, categoryId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: { ...values },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORIES_VERSIONS_ROOT_ID_CATEGORY_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
