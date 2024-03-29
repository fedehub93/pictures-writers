import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

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
