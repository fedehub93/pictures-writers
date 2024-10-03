import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createEbookSeo } from "@/lib/seo";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.create({
      data: {
        userId: user.id,
        title,
        version: 1,
      },
    });

    if (!ebook) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedEbook = await db.ebook.update({
      where: { id: ebook.id },
      data: {
        rootId: ebook.id,
      },
    });

    // Creo prima versione seo
    await createEbookSeo(updatedEbook);

    return NextResponse.json(updatedEbook);
  } catch (error) {
    console.log("[EBOOKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
