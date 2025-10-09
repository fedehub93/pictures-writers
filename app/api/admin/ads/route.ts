import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { adCampaignFormSchema } from "@/schemas/ads";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Data parsing and validation
    const body = await req.json();
    const parsed = adCampaignFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const campaign = await db.adCampaign.create({
      data: { ...values },
    });

    if (!campaign) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.log("[CAMPAIGN_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
