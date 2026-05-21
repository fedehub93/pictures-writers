import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
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

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.findFirst({
      where: {
        rootId: rootId,
        id: tagId,
      },
    });

    if (!tag) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedTag = await db.tag.deleteMany({
      where: { rootId },
    });

    if (tag.seoId) {
      await db.seo.delete({
        where: { id: tag.seoId },
      });
    }

    return NextResponse.json(deletedTag);
  } catch (error) {
    console.log("[TAGS_ROOT_ID_VERSIONS_TAG_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    const { tagId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.update({
      where: { id: tagId },
      data: { ...values },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAGS_VERSIONS_ROOT_ID_TAG_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
