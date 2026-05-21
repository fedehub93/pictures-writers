import { NextResponse } from "next/server";
import { ContentStatus } from "@/generated/prisma";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createProductCategorySeo } from "@/lib/seo";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.productCategory.create({
      data: {
        title,
        slug,
        version: 1,
      },
    });

    if (!category) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedCategory = await db.productCategory.update({
      where: { id: category.id },
      data: {
        rootId: category.id,
      },
    });

    // Creo prima versione seo
    await createProductCategorySeo(updatedCategory);

    return NextResponse.json(category);
  } catch (error) {
    console.log("[PRODUCT_CATEGORY_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const categories = await db.productCategory.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.log("[PRODUCT_CATEGORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
