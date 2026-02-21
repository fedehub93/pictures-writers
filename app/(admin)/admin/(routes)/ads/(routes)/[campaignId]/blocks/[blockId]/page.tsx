import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";
import { BlockForm } from "./_components/block-form";

const BlockIdPage = async (props: {
  params: Promise<{ campaignId: string; blockId: string }>;
}) => {
  await requireAdminAuth();

  const { campaignId, blockId } = await props.params;

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
