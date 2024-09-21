import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ebookId = searchParams.get("id");

    if (!ebookId) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const ebook = await db.ebook.findFirst({
      where: { rootId: ebookId },
      distinct: ["rootId"],
      orderBy: { createdAt: "desc" },
    });

    if (!ebook || !ebook.fileUrl) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Richiedi il file dal server esterno utilizzando axios
    const response = await axios.get(ebook.fileUrl, {
      responseType: "arraybuffer", // Richiedi il file come un buffer di dati binari
    });

    // Crea una response con le intestazioni per forzare il download
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ebook.title}.pdf"`,
    });

    return new NextResponse(response.data, { headers });
  } catch (error) {
    console.log("[EBOOKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
