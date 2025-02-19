import { NextResponse } from "next/server";
import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createNewVersionTag } from "@/lib/tag";

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      tagId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, tagId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const publishedTag = await db.tag.findFirst({
      where: {
        rootId,
        id: tagId,
      },
    });

    if (!publishedTag || !publishedTag.seoId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const seo = await db.seo.update({
      where: { id: publishedTag.seoId },
      data: { ...values },
    });

    if (publishedTag.status === ContentStatus.PUBLISHED) {
      const result = await createNewVersionTag(rootId, {});

      if (result.status !== 200) {
        return new NextResponse(result.message, { status: result.status });
      }
    }

    return NextResponse.json(seo);
  } catch (error) {
    console.log("[CATEGORIES_ROOT_ID_VERSIONS_CATEGORY_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
