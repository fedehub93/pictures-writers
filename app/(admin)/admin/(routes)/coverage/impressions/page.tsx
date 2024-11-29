import { auth } from "@clerk/nextjs/server";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

const ImpressionsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

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
