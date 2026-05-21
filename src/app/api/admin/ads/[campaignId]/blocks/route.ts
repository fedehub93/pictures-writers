import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { adBlockFormSchema } from "@/schemas/ads";

export async function POST(
  req: Request,
  props: { params: Promise<{ campaignId: string }> }
) {
  try {
    const user = await authAdmin();
    const { campaignId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const parsed = adBlockFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const campaign = await db.adBlock.create({
      data: {
        campaignId,
        ...values,
      },
    });

    if (!campaign) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.log("[CAMPAIGN_BLOCK_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
