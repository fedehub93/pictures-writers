import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { ContentStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { rootId: string; ebookId: string } }
) {
  try {
    const user = await authAdmin();
    const { rootId, ebookId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.findFirst({
      where: {
        id: ebookId,
        rootId,
      },
    });

    if (!ebook) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!ebook.title) {
      return new NextResponse("Missing required fields!", { status: 404 });
    }

    const publishedEbook = await db.ebook.update({
      where: { id: ebookId },
      data: { status: ContentStatus.PUBLISHED },
      include: { seo: true },
    });

    return NextResponse.json(publishedEbook);
  } catch (error) {
    console.log("[EBOOKS_VERSIONS_ROOT_ID_EBOOK_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
