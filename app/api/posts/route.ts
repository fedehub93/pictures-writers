import { NextResponse } from "next/server";
import { ContentStatus } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { createPostSeo } from "@/lib/seo";
import { getPaginatedPosts } from "@/data/post";

const POST_BATCH = 5;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const s = searchParams.get("s") || "";
    const page = Number(searchParams.get("page")) || 1;

    const { posts, pagination, nextCursor } = await getPaginatedPosts({
      cursor,
      searchString: s,
      page,
      postBatch: POST_BATCH,
    });

    return NextResponse.json({
      posts,
      pagination,
      nextCursor,
    });
  } catch (error) {
    console.log("[POST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
