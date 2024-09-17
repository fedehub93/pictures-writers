import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createTagSeo } from "@/lib/seo";

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
        version: 1,
      },
    });

    if (!tag) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedTag = await db.tag.update({
      where: { id: tag.id },
      data: {
        rootId: tag.id,
      },
    });

    // Creo prima versione seo
    await createTagSeo(updatedTag);

    return NextResponse.json(tag);
  } catch (error) {
    console.log("[TAG_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
