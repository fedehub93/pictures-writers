import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { BlockForm } from "./_components/block-form";

const BlockIdPage = async (props: {
  params: Promise<{ campaignId: string; blockId: string }>;
}) => {
  const { campaignId, blockId } = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const block = await db.adBlock.findFirst({
    where: {
      id: blockId,
      campaignId,
    },
    include: {
      items: true,
    },
  });

  if (!block || !block.id) {
    redirect(`/admin/ads/${campaignId}`);
  }

  return (
    <BlockForm
      initialData={block}
      apiUrl={`/api/admin/ads/${campaignId}/blocks`}
    />
  );
};

export default BlockIdPage;
