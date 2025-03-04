import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      productId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, productId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedProduct = await db.product.deleteMany({
      where: { rootId },
    });

    if (product.seoId) {
      await db.seo.delete({
        where: { id: product.seoId },
      });
    }

    return NextResponse.json(deletedProduct);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_PRODUCT_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      productId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, productId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const updatedProduct = await db.product.update({
      where: { id: product.id },
      data: {
        ...values,
        gallery: undefined,
        seo: undefined,
      },
    });

    await db.productGallery.deleteMany({
      where: { productId: updatedProduct.id },
    });

    await db.productGallery.createMany({
      data: values.gallery.map((v: { mediaId: string; sort: number }) => ({
        productId: product.id,
        mediaId: v.mediaId,
        sort: v.sort,
      })),
    });

    if (product.seoId && values.seo) {
      await db.seo.update({
        where: { id: product.seoId },
        data: { ...values.seo },
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_PRODUCT_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
