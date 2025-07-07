import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name, organizationId, slug } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.create({
      data: {
        name,
        slug,
        organizationId,
        version: 1,
      },
    });

    if (!contest) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updatedContest = await db.contest.update({
      where: { id: contest.id },
      data: {
        rootId: contest.id,
      },
    });

    return NextResponse.json(updatedContest);
  } catch (error) {
    console.log("[CONTESTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
