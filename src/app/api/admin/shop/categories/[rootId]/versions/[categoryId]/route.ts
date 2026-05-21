import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      categoryId: string;
    }>;
  }
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
        rootId: rootId,
        id: categoryId,
      },
    });

    if (!category) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedCategory = await db.productCategory.deleteMany({
      where: { rootId },
    });

    if (category.seoId) {
      await db.seo.delete({
        where: { id: category.seoId },
      });
    }

    return NextResponse.json(deletedCategory);
  } catch (error) {
    console.log(
      "[PRODUCT_CATEGORIES_ROOT_ID_VERSIONS_CATEGORY_ID_DELETE]",
      error
    );
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      categoryId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, categoryId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const category = await db.productCategory.update({
      where: { id: categoryId },
      data: {
        ...values,
        seo: undefined,
      },
    });

    if (category.seoId && values.seo) {
      await db.seo.update({
        where: { id: category.seoId },
        data: { ...values.seo },
      });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.log(
      "[PRODUCT_CATEGORIES_VERSIONS_ROOT_ID_CATEGORY_ID_PATCH]",
      error
    );
    return new NextResponse("Internal Error", { status: 500 });
  }
}
