import { NextResponse } from "next/server";
import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request, props: { params: Promise<{ rootId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Trovo ultima versione pubblicata
    const publishedTag = await db.tag.findFirst({
      where: { rootId, status: ContentStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
    });

    if (!publishedTag) {
      return new NextResponse("Tag not found", { status: 404 });
    }

    const tag = await db.tag.create({
      data: {
        ...publishedTag,
        ...values,
        id: undefined,
        status: ContentStatus.CHANGED,
        version: publishedTag.version + 1,
        rootId: undefined,
        root: {
          connect: { id: publishedTag.rootId },
        },
        createdAt: undefined,
        updatedAt: undefined,
        publishedAt: undefined,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAGS_VERSIONS_ROOT_ID_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
