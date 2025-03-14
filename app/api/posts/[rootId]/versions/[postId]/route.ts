import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
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
    const post = await db.post.update({
      where: { id: postId },
      data: {
        ...values,
        categories: undefined,
        postCategories: undefined,
        tags: values.tags
          ? {
              set: values.tags.map((tag: { id: string }) => ({
                id: tag.id,
              })),
            }
          : undefined,
        authors: undefined,
        postAuthors: undefined,
      },
    });

    if (postId && values.authors) {
      await db.postAuthor.deleteMany({
        where: {
          postId,
        },
      });

      for (const author of values.authors) {
        await db.postAuthor.create({
          data: {
            postId,
            userId: author.id,
            sort: author.sort,
          },
        });
      }
    }

    if (postId && values.categories) {
      await db.postCategory.deleteMany({
        where: {
          postId,
        },
      });

      for (const category of values.categories) {
        await db.postCategory.create({
          data: {
            postId,
            categoryId: category.id,
            sort: category.sort,
          },
        });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
