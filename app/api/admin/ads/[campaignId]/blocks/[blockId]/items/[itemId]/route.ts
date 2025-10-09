import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { adItemFormSchema } from "@/schemas/ads";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
      blockId: string;
      itemId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { campaignId, blockId, itemId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const item = await db.adItem.findFirst({
      where: {
        id: itemId,
        adBlockId: blockId,
      },
    });

    if (!item) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedItem = await db.adItem.deleteMany({
      where: {
        id: itemId,
        adBlockId: blockId,
      },
    });

    return NextResponse.json(deletedItem);
  } catch (error) {
    console.log("[CAMPAIGN_ID_BLOCK_ID_ITEM_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
      blockId: string;
      itemId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { blockId, itemId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const item = await db.adItem.findFirst({
      where: {
        id: itemId,
        adBlockId: blockId,
      },
    });

    if (!item) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const body = await req.json();
    const parsed = adItemFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const updatedItem = await db.adItem.updateMany({
      where: {
        id: itemId,
        adBlockId: blockId,
      },
      data: { ...values },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.log("[CAMPAIGN_ID_BLOCK_ID_ITEM_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
