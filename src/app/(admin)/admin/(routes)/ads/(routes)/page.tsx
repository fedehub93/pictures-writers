import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const AdsPage = async () => {
  await requireAdminAuth();

  const ads = await db.adCampaign.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Ads" totalEntries={ads.length} />
      <DataTable columns={columns} data={ads} />
    </div>
  );
};

export default AdsPage;
