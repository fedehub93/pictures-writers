import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { adCampaignFormSchema } from "@/schemas/ads";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { campaignId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const campaign = await db.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteCampaign = await db.adCampaign.deleteMany({
      where: { id: campaignId },
    });

    return NextResponse.json(deleteCampaign);
  } catch (error) {
    console.log("[CAMPAIGN_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      campaignId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { campaignId } = await props.params;

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

    const campaign = await db.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const updatedCampaign = await db.adCampaign.update({
      where: { id: campaign.id },
      data: { ...values },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.log("[CAMPAIGN_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
