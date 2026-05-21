import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PUT(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { blockId, items } = await req.json();

    for (let item of items) {
      await db.adItem.update({
        where: {
          adBlockId: blockId,
          id: item.id,
        },
        data: { sort: item.sort },
      });
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.log("[ITEMS_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
