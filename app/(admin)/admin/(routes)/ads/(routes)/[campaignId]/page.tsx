import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { CampaignForm } from "./_components/campaign-form";

const CampaignIdPost = async (props: {
  params: Promise<{ campaignId: string }>;
}) => {
  const { campaignId } = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

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
