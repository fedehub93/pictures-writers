import { NextResponse } from "next/server";

import { ContentStatus } from "@prisma/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { createNewVersionProduct } from "@/lib/product";

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
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const publishedProduct = await db.product.findFirst({
      where: {
        rootId,
        id: productId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!publishedProduct || !publishedProduct.seoId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const seo = await db.seo.update({
      where: { id: publishedProduct.seoId },
      data: { ...values },
    });

    // Se ultima versione è pubblicata allora creo nuova versione poiché seo modificata
    if (publishedProduct.status === ContentStatus.PUBLISHED) {
      const result = await createNewVersionProduct(rootId, {});

      if (result.status !== 200) {
        return new NextResponse(result.message, { status: result.status });
      }
    }
    return NextResponse.json(seo);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_PRODUCT_ID_SEO]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
