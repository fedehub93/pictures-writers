import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma";
import { createNewVersionPost } from "@/lib/post";

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
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const publishedPost = await db.post.findFirst({
      where: {
        rootId,
        id: postId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!publishedPost || !publishedPost.seoId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const seo = await db.seo.update({
      where: { id: publishedPost.seoId },
      data: { ...values },
    });

    // Se ultima versione è pubblicata allora creo nuova versione poiché seo modificata
    if (publishedPost.status === ContentStatus.PUBLISHED) {
      const result = await createNewVersionPost(rootId, {});

      if (result.status !== 200) {
        return new NextResponse(result.message, { status: result.status });
      }
    }
    return NextResponse.json(seo);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
