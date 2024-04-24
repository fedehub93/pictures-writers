import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { ebookId: string } }
) {
  try {
    const user = await authAdmin();
    const { ebookId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.findUnique({
      where: {
        id: params.ebookId,
      },
    });

    if (!ebook) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedEbook = await db.ebook.delete({
      where: { id: ebookId },
    });

    return NextResponse.json(deletedEbook);
  } catch (error) {
    console.log("[EBOOK_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { ebookId: string } }
) {
  try {
    const user = await authAdmin();
    const { ebookId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.update({
      where: {
        id: ebookId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(ebook);
  } catch (error) {
    console.log("[EBOOK_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
