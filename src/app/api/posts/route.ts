import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import { createPost } from "@/modules/blog/posts/lib/create-post";

export { GET } from "@/modules/blog/posts/server/api/get-infinite-query";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !slug) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const post = await createPost({
      title,
      slug,
      userId: user.id,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POST_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
