import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ItemForm } from "./_components/item-form";

const ItemIdPage = async (props: {
  params: Promise<{ campaignId: string; blockId: string; itemId: string }>;
}) => {
  const { campaignId, blockId, itemId } = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

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
