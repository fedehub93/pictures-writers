import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createCategorySeo } from "@/lib/seo";
import { ContentStatus } from "@/generated/prisma";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await db.category.create({
      data: {
        title,
        slug,
        version: 1,
      },
    });

    if (!category) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedCategory = await db.category.update({
      where: { id: category.id },
      data: {
        rootId: category.id,
      },
    });

    // Creo prima versione seo
    await createCategorySeo(updatedCategory);

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const categories = await db.category.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.log("[CATEGORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
