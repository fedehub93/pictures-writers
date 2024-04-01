import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await authAdmin();
    const { postId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const seo = await db.seo.updateMany({
      where: {
        Post: { id: postId },
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(seo);
  } catch (error) {
    console.log("[POST_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
