import { NextResponse } from "next/server";
import { ContentStatus } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { products } = await req.json();

    const publishedProducts = [];

    for (const p of products) {
      const product = await db.product.findFirst({
        where: {
          rootId: p.rootId,
          id: p.id,
        },
      });

      if (!product) {
        return new NextResponse("Not found", { status: 404 });
      }

      if (
        !product.title ||
        !product.description ||
        !product.imageCoverId ||
        !product.categoryId
      ) {
        return new NextResponse("Missing required fields!", { status: 404 });
      }

      // Aggiorna la vecchia versione
      await db.product.updateMany({
        where: { rootId: p.rootId },
        data: { isLatest: false },
      });

      const publishedProduct = await db.product.update({
        where: {
          id: p.id,
        },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
        },
        include: {
          seo: true,
        },
      });
      publishedProducts.push(publishedProduct);
    }

    return NextResponse.json(publishedProducts);
  } catch (error) {
    console.log("[PRODUCTS_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
