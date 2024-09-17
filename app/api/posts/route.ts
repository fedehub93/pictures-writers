import { NextResponse } from "next/server";
import { Post, ContentStatus, User } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { createPostSeo } from "@/lib/seo";

const POST_BATCH = 5;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const s = searchParams.get("s") || "";
    const page = Number(searchParams.get("page")) || 1;

    let posts: Post[] = [];
    let totalPosts = 0;

    const skip = (page - 1) * POST_BATCH;
    const take = POST_BATCH;

    if (cursor) {
      const posts = await db.post.findMany({
        where: {
          status: ContentStatus.PUBLISHED,
          OR: [
            {
              title: {
                contains: s,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: s,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          user: true,
        },
        distinct: ["rootId"],
        take: POST_BATCH,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lastPublishedPosts = posts.map((post) => {
        const lastPublishedPost = { ...post };
        return lastPublishedPost;
      });

      return NextResponse.json({ items: lastPublishedPosts, nextCursor: null });
    }

    posts = await db.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        OR: [
          {
            title: {
              contains: s,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: s,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        user: true,
      },
      distinct: ["rootId"],
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    totalPosts = await db.post.count();

    const lastPublishedPosts = posts.map((post) => {
      const lastPublishedPost = { ...post };
      return lastPublishedPost;
    });

    const pagination = {
      page,
      perPage: POST_BATCH,
      totalRecords: totalPosts,
      totalPages: Math.ceil(totalPosts / POST_BATCH),
    };

    let nextCursor = null;

    if (posts.length === POST_BATCH) {
      nextCursor = posts[POST_BATCH - 1].id;
    }

    return NextResponse.json({
      items: lastPublishedPosts,
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
