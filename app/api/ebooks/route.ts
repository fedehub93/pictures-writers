import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { title } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ebook = await db.ebook.create({
      data: {
        userId: user.id,
        title,
      },
    });

    return NextResponse.json(ebook);
  } catch (error) {
    console.log("[EBOOKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
