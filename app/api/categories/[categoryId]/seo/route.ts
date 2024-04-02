import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const user = await authAdmin();
    const { categoryId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const seo = await db.seo.updateMany({
      where: {
        category: { id: categoryId },
      },
      data: {
        ...values,
      },
    });

    await db.category.update({
      where: {
        id: categoryId,
      },
      data: {
        isPublished: false,
      },
    });

    return NextResponse.json(seo);
  } catch (error) {
    console.log("[CATEGORY_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
