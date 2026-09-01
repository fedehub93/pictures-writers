import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { publishDuePosts } from "@/modules/blog/posts/lib/publish-due-posts";

const SECRET_HEADER = "x-scheduled-publication-secret";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function constantTimeCompare(a: string, b: string) {
  return timingSafeEqual(hashSecret(a), hashSecret(b));
}

export async function POST(req: Request) {
  try {
    const providedSecret = req.headers.get(SECRET_HEADER);
    const expectedSecret = process.env.SCHEDULED_PUBLICATION_SECRET;

    if (
      !expectedSecret ||
      !providedSecret ||
      !constantTimeCompare(providedSecret, expectedSecret)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await publishDuePosts();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PUBLISH_SCHEDULED_POSTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
