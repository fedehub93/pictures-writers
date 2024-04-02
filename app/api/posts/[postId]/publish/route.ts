import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await authAdmin();
    const { postId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        tags: true,
      },
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (
      !post.title ||
      !post.description ||
      !post.imageCoverId ||
      !post.categoryId
    ) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    const publishedPost = await db.post.update({
      where: {
        id: postId,
      },
      data: {
        isPublished: true,
      },
      include: {
        seo: true,
      },
    });

    if (publishedPost) {
      await db.postVersion.create({
        data: {
          postId: post.id,
          title: post.title,
          description: post.description,
          slug: post.slug,
          bodyData: post.bodyData,
          imageCoverId: post.imageCoverId,
          categoryId: post.categoryId,
          tags: {
            connect: post.tags.map((tag) => ({ id: tag.id })),
          },
        },
      });

      if (publishedPost.seo) {
        const postSeo = await db.seo.update({
          where: {
            id: publishedPost.seo.id,
          },
          data: {
            isPublished: true,
          },
        });

        await db.seoVersion.create({
          data: {
            seoId: postSeo.id,
            title: postSeo.title,
            description: postSeo.description,
            canonicalUrl: postSeo.canonicalUrl,
            ogTwitterType: postSeo.ogTwitterType,
            ogTwitterTitle: postSeo.ogTwitterTitle,
            ogTwitterDescription: postSeo.ogTwitterDescription,
            ogTwitterImageId: postSeo.ogTwitterImageId,
            ogTwitterLocale: postSeo.ogTwitterLocale,
            ogTwitterUrl: postSeo.ogTwitterUrl,
            noIndex: postSeo.noIndex,
            noFollow: postSeo.noFollow,
          },
        });
      }
    }

    return NextResponse.json(publishedPost);
  } catch (error) {
    console.log("[POST_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
