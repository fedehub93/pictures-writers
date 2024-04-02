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

    const tag = await db.tag.create({
      data: {
        title,
        slug,
        isPublished: false,
      },
    });

    await db.seo.create({
      data: {
        title: tag.title,
        description: tag.description,
        ogTwitterTitle: tag.title,
        ogTwitterDescription: tag.description,
        ogTwitterType: "card",
        ogTwitterLocale: "it_IT",
        tag: { connect: { id: tag.id } },
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAGS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
