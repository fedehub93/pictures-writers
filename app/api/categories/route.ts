import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

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
        isPublished: false,
      },
    });

    await db.seo.create({
      data: {
        title: category.title,
        description: category.description,
        ogTwitterTitle: category.title,
        ogTwitterDescription: category.description,
        ogTwitterType: "card",
        ogTwitterLocale: "it_IT",
        categoryId: category.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORIES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}