import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      postId: string;
    };
  }
) {
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
        status: ContentStatus.PUBLISHED,
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
