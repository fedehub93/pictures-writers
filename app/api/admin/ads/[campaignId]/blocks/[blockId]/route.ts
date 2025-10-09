import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { adBlockFormSchema } from "@/schemas/ads";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
      blockId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { campaignId, blockId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const block = await db.adBlock.findFirst({
      where: {
        id: blockId,
        campaignId,
      },
    });

    if (!block) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteBlock = await db.adBlock.deleteMany({
      where: {
        id: blockId,
        campaignId,
      },
    });

    return NextResponse.json(deleteBlock);
  } catch (error) {
    console.log("[CAMPAIGN_ID_BLOCK_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
      blockId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { campaignId, blockId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const block = await db.adBlock.findFirst({
      where: {
        id: blockId,
        campaignId,
      },
    });

    if (!block) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const body = await req.json();
    const parsed = adBlockFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const updatedBlock = await db.adBlock.updateMany({
      where: {
        id: block.id,
        campaignId: campaignId,
      },
      data: { ...values },
    });

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.log("[CAMPAIGN_ID_BLOCK_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
