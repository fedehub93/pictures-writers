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

    const post = await db.post.findUnique({
      where: {
        id: params.postId,
      },
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedPost = await db.post.deleteMany({
      where: { rootId },
    });

    if (post.seoId) {
      await db.seo.delete({
        where: { id: post.seoId },
      });
    }

    return NextResponse.json(deletedPost);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST_ID_DELETE]", error);
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
      postId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, postId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await db.post.update({
      where: { id: postId },
      data: {
        ...values,
        tags: values.tags
          ? {
              set: values.tags.map(
                (tagId: { label: string; value: string }) => ({
                  id: tagId.value,
                })
              ),
            }
          : undefined,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
