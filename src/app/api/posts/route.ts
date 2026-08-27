import { NextResponse } from "next/server";
import { ContentStatus } from "@/generated/prisma";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { createPostSeo } from "@/lib/seo";

export { GET } from "@/modules/blog/posts/server/api/get-infinite-query";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Creo prima versione post
    const post = await db.post.create({
      data: {
        title,
        slug,
        version: 1,
        status: ContentStatus.DRAFT,
        bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
        userId: user.id,
      },
    });

    if (!post) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    await db.postAuthor.create({
      data: {
        postId: post.id,
        userId: user.id,
        sort: 0,
      },
    });

    const updatedPost = await db.post.update({
      where: { id: post.id },
      data: {
        rootId: post.id,
      },
    });

    // Creo prima versione seo
    await createPostSeo(updatedPost);

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POST_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
