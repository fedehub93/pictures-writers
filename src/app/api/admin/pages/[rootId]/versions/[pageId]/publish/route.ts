import { NextResponse } from "next/server";

import { ContentStatus } from "@/generated/prisma";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      pageId: string;
    }>;
  },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, pageId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const page = await db.page.findFirst({
      where: {
        rootId,
        id: pageId,
      },
      select: {
        title: true,
        version: true,
      },
    });

    if (!page) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!page.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    // Aggiorna la vecchia versione
    await db.page.updateMany({
      where: { rootId: rootId },
      data: { isLatest: false },
    });

    const publishedPage = await db.page.update({
      where: {
        id: pageId,
      },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        firstPublishedAt: page.version === 1 ? new Date() : undefined,
        publishedAt: new Date(),
      },
      include: {
        seo: true,
      },
    });

    return NextResponse.json(publishedPage);
  } catch (error) {
    console.log("[PAGES_ROOT_ID_VERSIONS_PAGE_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
