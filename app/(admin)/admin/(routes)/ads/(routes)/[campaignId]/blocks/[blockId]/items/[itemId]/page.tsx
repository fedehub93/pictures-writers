import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";
import { ItemForm } from "./_components/item-form";

const ItemIdPage = async (props: {
  params: Promise<{ campaignId: string; blockId: string; itemId: string }>;
}) => {
  await requireAdminAuth();
  const { campaignId, blockId, itemId } = await props.params;

  const item = await db.adItem.findFirst({
    where: {
      id: itemId,
      adBlockId: blockId,
    },
  });

  if (!item || !item.id) {
    redirect(`/admin/ads/${campaignId}/blocks/${blockId}`);
  }

  return (
    <ItemForm
      campaignId={campaignId}
      initialData={item}
      apiUrl={`/api/admin/ads/${campaignId}/blocks/${blockId}/items`}
    />
  );
};

export default ItemIdPage;
