import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { title, slug } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: {
        externalUserId: userId,
      },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await db.post.create({
      data: {
        userId: user.id,
        title,
        slug,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
