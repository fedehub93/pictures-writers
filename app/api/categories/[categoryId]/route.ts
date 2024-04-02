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

    const category = await db.category.update({
      where: {
        id: categoryId,
      },
      data: {
        ...values,
        isPublished: false,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
