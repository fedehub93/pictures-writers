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

    if (!tag.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    const publishedTag = await db.tag.update({
      where: {
        id: tagId,
      },
      data: {
        isPublished: true,
      },
      include: { seo: true },
    });

    if (publishedTag) {
      await db.tagVersion.create({
        data: {
          tagId: tag.id,
          title: tag.title,
          description: tag.description,
          slug: tag.slug,
        },
      });

      if (publishedTag.seo) {
        const tagSeo = await db.seo.update({
          where: {
            id: publishedTag.seo.id,
          },
          data: {
            isPublished: true,
          },
        });

        await db.seoVersion.create({
          data: {
            seoId: tagSeo.id,
            title: tagSeo.title,
            description: tagSeo.description,
            canonicalUrl: tagSeo.canonicalUrl,
            ogTwitterType: tagSeo.ogTwitterType,
            ogTwitterTitle: tagSeo.ogTwitterTitle,
            ogTwitterDescription: tagSeo.ogTwitterDescription,
            ogTwitterImageId: tagSeo.ogTwitterImageId,
            ogTwitterLocale: tagSeo.ogTwitterLocale,
            ogTwitterUrl: tagSeo.ogTwitterUrl,
            noIndex: tagSeo.noIndex,
            noFollow: tagSeo.noFollow,
          },
        });
      }
    }

    return NextResponse.json(publishedTag);
  } catch (error) {
    console.log("[TAG_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
