import { NextResponse } from "next/server";
import { ContentStatus } from "@prisma/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { createNewVersionCategory } from "@/lib/category";

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

    const publishedCategory = await db.category.findFirst({
      where: {
        rootId,
        id: categoryId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!publishedCategory || !publishedCategory.seoId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const seo = await db.seo.update({
      where: { id: publishedCategory.seoId },
      data: { ...values },
    });

    // Se ultima versione è pubblicata allora creo nuova versione poiché seo modificata
    if (publishedCategory.status === ContentStatus.PUBLISHED) {
      const result = await createNewVersionCategory(rootId, {});

      if (result.status !== 200) {
        return new NextResponse(result.message, { status: result.status });
      }
    }

    return NextResponse.json(seo);
  } catch (error) {
    console.log("[CATEGORIES_ROOT_ID_VERSIONS_CATEGORY_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
