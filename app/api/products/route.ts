import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createProductSeo } from "@/lib/seo";
import { ProductCategory } from "@prisma/client";
import { EbookMetadata, EbookType } from "@/types";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug, category } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let metadata: EbookMetadata | null | undefined;
    if (category === ProductCategory.EBOOK) {
      metadata = {
        edition: "",
        formats: [
          { type: EbookType.PDF, url: "", size: 0, pages: 0 },
          { type: EbookType.EPUB, url: "", size: 0, pages: 0 },
          { type: EbookType.MOBI, url: "", size: 0, pages: 0 },
        ],
        authorId: "",
      };
    }

    const product = await db.product.create({
      data: {
        userId: user.id,
        title,
        description: [{ type: "paragraph", children: [{ text: "" }] }],
        slug,
        category,
        version: 1,
        price: 0,
        metadata,
      },
    });

    if (!product) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedProduct = await db.product.update({
      where: { id: product.id },
      data: {
        rootId: product.id,
      },
    });

    // Creo prima versione seo
    await createProductSeo(updatedProduct);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.log("[PRODUCTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
