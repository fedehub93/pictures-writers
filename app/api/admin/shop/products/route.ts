import { NextResponse } from "next/server";

import { ContentStatus, Product, ProductType } from "@/generated/prisma";
import {
  AffiliateMetadata,
  EbookMetadata,
  EbookType,
  ServiceMetadata,
  WebinarMetadata,
} from "@/types";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createProductSeo } from "@/lib/seo";

const PRODUCT_BATCH = 4;

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title, slug, type } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let metadata:
      | EbookMetadata
      | AffiliateMetadata
      | WebinarMetadata
      | ServiceMetadata
      | null
      | undefined = null;

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

    if (type === ProductType.WEBINAR) {
      metadata = {
        type: ProductType.WEBINAR,
        lessons: [],
        seats: 0,
        platform: "",
        isOpen: false,
      };
    }

    if (type === ProductType.SERVICE) {
      metadata = {
        type: ProductType.SERVICE,
        serviceType: "",
        competitorPrice: 0,
        target: "",
        attachamentUrl: "",
        features: [],
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
    const perPage = Number(searchParams.get("per_page")) || PRODUCT_BATCH;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let products: Product[] = [];
    let totalProducts = 0;

    const skip = (page - 1) * perPage;
    const take = perPage;

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
        take: perPage,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor = null;

      if (products.length === perPage) {
        nextCursor = products[perPage - 1].id;
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
        db.product.count({
          where: {
            isLatest: true,
            status: ContentStatus.PUBLISHED,
            title: { contains: s, mode: "insensitive" },
          },
        }),
      ]);
    }

    const pagination = {
      page,
      perPage: perPage,
      totalRecords: totalProducts,
      totalPages: Math.ceil(totalProducts / perPage),
    };

    let nextCursor = null;

    if (products.length === perPage) {
      nextCursor = products[perPage - 1].id;
    }

    return NextResponse.json({ items: products, pagination, nextCursor });
  } catch (error) {
    console.log("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
