import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const ImpressionsPage = async () => {
  await requireAdminAuth();

  const impressions = await db.impression.findMany({
    include: {
      file: true,
      format: true,
      genre: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Impressions" totalEntries={impressions.length} />
      <DataTable columns={columns} data={impressions} />
    </div>
  );
};

export default ImpressionsPage;
