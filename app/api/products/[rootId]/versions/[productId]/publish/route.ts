import { NextResponse } from "next/server";

import { ContentStatus, ProductCategory } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { triggerWebhookBuild } from "@/lib/vercel";
import { isEbookMetadata } from "@/type-guards";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      rootId: string;
      productId: string;
    };
  }
) {
  try {
    const user = await authAdmin();
    const { rootId, productId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await db.product.findFirst({
      where: {
        rootId,
        id: productId,
      },
    });

    if (!product) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!product.title || !product.imageCoverId) {
      return new NextResponse("Missing required fields!", { status: 400 });
    }

    if (
      product.category === ProductCategory.EBOOK &&
      isEbookMetadata(product.metadata)
    ) {
      if (product.metadata.formats.length === 0) {
        return new NextResponse("Missing required fields!", { status: 400 });
      } else {
        console.error("Metadata for EBOOK is invalid or missing");
      }
    }

    // Aggiorna la vecchia versione
    await db.product.updateMany({
      where: { rootId: rootId },
      data: { isLatest: false },
    });

    const publishedProduct = await db.product.update({
      where: {
        id: productId,
      },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
      include: {
        seo: true,
      },
    });

    if (process.env.NODE_ENV === "production" && publishedProduct) {
      await triggerWebhookBuild();
    }

    return NextResponse.json(publishedProduct);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_PRODUCT_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
