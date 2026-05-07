import { NextResponse } from "next/server";

import { ContentStatus } from "@/generated/prisma";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { createPageSeo } from "@/lib/seo";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Creo prima versione post
    const page = await db.page.create({
      data: {
        title,
        slug,
        version: 1,
        status: ContentStatus.DRAFT,
        puckData: {},
        userId: user.id,
      },
    });

    if (!page) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedPage = await db.page.update({
      where: { id: page.id },
      data: {
        rootId: page.id,
      },
    });

    // Creo prima versione seo
    await createPageSeo(updatedPage);

    return NextResponse.json(page);
  } catch (error) {
    console.log("[PAGE_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
