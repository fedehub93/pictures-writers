import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      ebookId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, ebookId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.findUnique({
      where: { id: ebookId },
    });

    if (!ebook) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedEbook = await db.ebook.deleteMany({
      where: { rootId },
    });

    if (ebook.seoId) {
      await db.seo.delete({
        where: { id: ebook.seoId },
      });
    }

    return NextResponse.json(deletedEbook);
  } catch (error) {
    console.log("[EBOOKS_ROOT_ID_VERSIONS_EBOOK_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      ebookId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, ebookId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.update({
      where: { id: ebookId },
      data: {
        ...values,
      },
    });

    return NextResponse.json(ebook);
  } catch (error) {
    console.log("[EBOOKS_ROOT_ID_VERSIONS_EBOOK_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
