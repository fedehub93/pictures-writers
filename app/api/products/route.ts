import { NextResponse } from "next/server";

import { ContentStatus, Product, ProductType } from "@prisma/client";
import { AffiliateMetadata, EbookMetadata, EbookType } from "@/types";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createProductSeo } from "@/lib/seo";

const PRODUCT_BATCH = 6;

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug, type } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let metadata: EbookMetadata | AffiliateMetadata | null | undefined = null;
    if (type === ProductType.EBOOK) {
      metadata = {
        type: ProductType.EBOOK,
        edition: "",
        formats: [
          { type: EbookType.PDF, url: "", size: 0, pages: 0 },
          { type: EbookType.EPUB, url: "", size: 0, pages: 0 },
          { type: EbookType.MOBI, url: "", size: 0, pages: 0 },
        ],
        publishedAt: null,
        author: null,
      };
    }

    if (type === ProductType.AFFILIATE) {
      metadata = {
        type: ProductType.AFFILIATE,
        url: "",
      };
    }

    const product = await db.product.create({
      data: {
        userId: user.id,
        title,
        description: [{ type: "paragraph", children: [{ text: "" }] }],
        slug,
        type,
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

export async function GET(req: Request) {
  try {
    const user = await authAdmin();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const s = searchParams.get("s") || "";
    const page = Number(searchParams.get("page")) || 1;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let products: Product[] = [];
    let totalProducts = 0;

    const skip = (page - 1) * PRODUCT_BATCH;
    const take = PRODUCT_BATCH;

    if (cursor) {
      const products = await db.product.findMany({
        where: {
          isLatest: true,
          status: ContentStatus.PUBLISHED,
          title: { contains: s, mode: "insensitive" },
        },
        include: {
          imageCover: true,
        },
        take: PRODUCT_BATCH,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor = null;

      if (products.length === PRODUCT_BATCH) {
        nextCursor = products[PRODUCT_BATCH - 1].id;
      }

      return NextResponse.json({ items: products, nextCursor });
    } else {
      [products, totalProducts] = await db.$transaction([
        db.product.findMany({
          where: {
            isLatest: true,
            status: ContentStatus.PUBLISHED,
            title: { contains: s, mode: "insensitive" },
          },
          include: {
            imageCover: true,
          },
          take,
          skip,
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.product.count(),
      ]);
    }

    const pagination = {
      page,
      perPage: PRODUCT_BATCH,
      totalRecords: totalProducts,
      totalPages: Math.ceil(totalProducts / PRODUCT_BATCH),
    };

    let nextCursor = null;

    if (products.length === PRODUCT_BATCH) {
      nextCursor = products[PRODUCT_BATCH - 1].id;
    }

    return NextResponse.json({ items: products, pagination, nextCursor });
  } catch (error) {
    console.log("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
