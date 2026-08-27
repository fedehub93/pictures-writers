import { NextResponse } from "next/server";

import { POST_BATCH } from "../../constants";
import { getPaginatedPosts } from "../queries";

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
