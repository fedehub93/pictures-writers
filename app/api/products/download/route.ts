import { NextResponse } from "next/server";
import axios from "axios";

import { db } from "@/lib/db";
import { isEbookMetadata, isValidEbookFormat } from "@/type-guards";

export const dynamic = "force-dynamic";

const mimeTypes = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("id");
    const format = searchParams.get("format");

    if (!productId || !isValidEbookFormat(format)) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product || !isEbookMetadata(product.metadata)) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const productFormat = product.metadata.formats.find(
      (f) => f.type === format
    );

    if (!productFormat) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Richiedi il file dal server esterno utilizzando axios
    const response = await axios.get(productFormat.url, {
      responseType: "arraybuffer", // Richiedi il file come un buffer di dati binari
    });

    // Crea una response con le intestazioni per forzare il download
    const headers = new Headers({
      "Content-Type": mimeTypes[format],
      "Content-Disposition": `attachment; filename="${product.title}.${format}"`,
    });

    return new NextResponse(response.data, { headers });
  } catch (error) {
    console.log("[EBOOKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
