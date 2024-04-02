import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const user = await authAdmin();
    const { tagId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.findUnique({
      where: {
        id: params.tagId,
      },
    });

    if (!tag) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedTag = await db.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json(deletedTag);
  } catch (error) {
    console.log("[TAG_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const user = await authAdmin();
    const { tagId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tag = await db.tag.update({
      where: {
        id: tagId,
      },
      data: {
        ...values,
        isPublished: false,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAG_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
