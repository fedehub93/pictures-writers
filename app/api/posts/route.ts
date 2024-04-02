import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

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
        post: { connect: { id: post.id } },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
