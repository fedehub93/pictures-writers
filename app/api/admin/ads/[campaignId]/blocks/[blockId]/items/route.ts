import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { adItemFormSchema } from "@/schemas/ads";

export async function POST(
  req: Request,
  props: { params: Promise<{ campaignId: string; blockId: string }> }
) {
  try {
    const user = await authAdmin();
    const { blockId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const parsed = adItemFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const maxSort = await db.adItem.findFirst({
      where: { adBlockId: blockId },
      orderBy: { sort: "desc" },
      select: { sort: true },
    });

    const nextSort = maxSort?.sort ? maxSort.sort + 1 : 1;

    const item = await db.adItem.create({
      data: {
        adBlockId: blockId,
        ...values,
        sort: nextSort,
      },
    });

    if (!item) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.log("[CAMPAIGN_ID_BLOCK_ID_ITEM_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
