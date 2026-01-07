import { NextResponse } from "next/server";

import { ContentStatus } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      postId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, postId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await db.post.findFirst({
      where: {
        rootId,
        id: postId,
      },
      select: {
        title: true,
        description: true,
        imageCoverId: true,
        postCategories: {
          select: {
            category: {
              select: {
                id: true,
              },
            },
          },
        },
        version: true,
      },
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (
      !post.title ||
      !post.description ||
      !post.imageCoverId ||
      !post.postCategories.length
    ) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    // Aggiorna la vecchia versione
    await db.post.updateMany({
      where: { rootId: rootId },
      data: { isLatest: false },
    });

    const publishedPost = await db.post.update({
      where: {
        id: postId,
      },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        firstPublishedAt: post.version === 1 ? new Date() : undefined,
        publishedAt: new Date(),
      },
      include: {
        seo: true,
      },
    });

    return NextResponse.json(publishedPost);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
