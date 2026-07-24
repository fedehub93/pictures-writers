import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

export async function DELETE(
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

    const page = await db.page.findUnique({
      where: {
        id: params.pageId,
      },
    });

    if (!page) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedPage = await db.page.deleteMany({
      where: { rootId },
    });

    if (page.seoId) {
      await db.seo.delete({
        where: { id: page.seoId },
      });
    }

    return NextResponse.json(deletedPage);
  } catch (error) {
    console.log("[PAGES_ROOT_ID_VERSIONS_PAGE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dehydratedPuckData = values.puckData
      ? dehydratePuckForms(values.puckData)
      : null;

    const page = await db.page.update({
      where: { id: pageId, rootId },
      data: { ...values, puckData: dehydratedPuckData },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.log("[PAGES_ROOT_ID_VERSIONS_PAGE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
