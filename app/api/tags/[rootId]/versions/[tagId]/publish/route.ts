import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      tagId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, tagId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.findFirst({
      where: {
        id: tagId,
        rootId,
      },
    });

    if (!tag) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!tag.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    // Aggiorno vecchie versioni
    await db.tag.updateMany({
      where: { rootId: rootId },
      data: { isLatest: false },
    });

    const publishedTag = await db.tag.update({
      where: { id: tagId },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        firstPublishedAt: tag.version === 1 ? new Date() : undefined,
        publishedAt: new Date(),
      },
      include: {
        seo: true,
      },
    });

    return NextResponse.json(publishedTag);
  } catch (error) {
    console.log("[TAGS_VERSIONS_ROOT_ID_TAG_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
