import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

const RequestSchema = z.object({
  ids: z.array(z.uuid()).nonempty(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { ids } = RequestSchema.parse(body);

    const products = await db.product.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        rootId: { in: ids },
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        imageCover: { select: { url: true } },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: error.message },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
