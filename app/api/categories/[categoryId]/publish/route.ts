import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

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

    if (!category.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    const publishedCategory = await db.category.update({
      where: {
        id: categoryId,
      },
      data: {
        isPublished: true,
      },
      include: {
        seo: true,
      },
    });

    if (publishedCategory) {
      await db.categoryVersion.create({
        data: {
          categoryId: category.id,
          title: category.title,
          description: category.description,
          slug: category.slug,
        },
      });

      if (publishedCategory.seo) {
        const categorySeo = await db.seo.update({
          where: {
            id: publishedCategory.seo.id,
          },
          data: {
            isPublished: true,
          },
        });

        await db.seoVersion.create({
          data: {
            seoId: categorySeo.id,
            title: categorySeo.title,
            description: categorySeo.description,
            canonicalUrl: categorySeo.canonicalUrl,
            ogTwitterType: categorySeo.ogTwitterType,
            ogTwitterTitle: categorySeo.ogTwitterTitle,
            ogTwitterDescription: categorySeo.ogTwitterDescription,
            ogTwitterImageId: categorySeo.ogTwitterImageId,
            ogTwitterLocale: categorySeo.ogTwitterLocale,
            ogTwitterUrl: categorySeo.ogTwitterUrl,
            noIndex: categorySeo.noIndex,
            noFollow: categorySeo.noFollow,
          },
        });
      }
    }

    return NextResponse.json(publishedCategory);
  } catch (error) {
    console.log("[CATEGORY_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
