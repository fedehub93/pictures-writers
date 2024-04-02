import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function DELETE(
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
        id: params.postId,
      },
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedPost = await db.post.delete({
      where: { id: postId },
    });

    return NextResponse.json(deletedPost);
  } catch (error) {
    console.log("[POST_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await authAdmin();
    const { postId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await db.post.update({
      where: {
        id: postId,
      },
      data: {
        ...values,
        isPublished: false,
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
    console.log("[POST_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
