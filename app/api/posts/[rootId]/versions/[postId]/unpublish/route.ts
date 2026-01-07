import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@/prisma/generated/client";

export async function PATCH(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
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
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedPost = await db.post.update({
      where: { id: postId },
      data: { status: ContentStatus.CHANGED },
    });

    return NextResponse.json(unpublishedPost);
  } catch (error) {
    console.log("[POST_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
