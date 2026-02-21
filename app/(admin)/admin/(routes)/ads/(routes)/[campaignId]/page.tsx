import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { CampaignForm } from "./_components/campaign-form";
import { requireAdminAuth } from "@/lib/auth-utils";

const CampaignIdPost = async (props: {
  params: Promise<{ campaignId: string }>;
}) => {
  await requireAdminAuth();

  const { campaignId } = await props.params;

  const campaign = await db.adCampaign.findFirst({
    where: {
      id: campaignId,
    },
    include: {
      blocks: true,
    },
  });

  if (!campaign || !campaign.id) {
    redirect("/admin/ads");
  }

  return <CampaignForm initialData={campaign} apiUrl="/api/admin/ads" />;
};

export default CampaignIdPost;
