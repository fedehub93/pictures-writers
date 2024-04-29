import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { Post, PostVersion, User } from "@prisma/client";

const POST_BATCH = 5;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const s = searchParams.get("s") || "";
    const page = Number(searchParams.get("page")) || 1;

    let posts: (Post & {
      versions: PostVersion[];
      user: User;
    })[] = [];
    let totalPosts = 0;

    const skip = (page - 1) * POST_BATCH;
    const take = POST_BATCH;

    if (cursor) {
      const posts = await db.post.findMany({
        where: {
          isPublished: true,
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
          versions: {
            include: {
              imageCover: true,
              category: true,
              tags: true,
            },
            take: 1,
            orderBy: {
              publishedAt: "desc",
            },
          },
          user: true,
        },
        take: POST_BATCH,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lastPublishedPosts = posts.map((post) => {
        const lastPublishedPost = { ...post.versions[0], user: post.user };
        return lastPublishedPost;
      });

      return NextResponse.json({ items: lastPublishedPosts, nextCursor: null });
    }

    posts = await db.post.findMany({
      where: {
        isPublished: true,
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
        versions: {
          include: {
            imageCover: true,
            category: true,
            tags: true,
          },
          take: 1,
          orderBy: {
            publishedAt: "desc",
          },
        },
        user: true,
      },
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    totalPosts = await db.post.count();

    const lastPublishedPosts = posts.map((post) => {
      const lastPublishedPost = { ...post.versions[0], user: post.user };
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

    const post = await db.post.create({
      data: {
        userId: user.id,
        title,
        slug,
        bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
        isPublished: false,
      },
    });

    await db.seo.create({
      data: {
        title: post.title,
        description: post.description,
        ogTwitterTitle: post.title,
        ogTwitterDescription: post.description,
        ogTwitterType: "card",
        ogTwitterLocale: "it_IT",
        ogTwitterImageId: post.imageCoverId,
        postId: post.id,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
