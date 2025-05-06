import { auth } from "@clerk/nextjs/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const ContestsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const contests = await db.contest.findMany({
    where: {
      OR: [
        { languageId: null },
        {
          language: {
            isDefault: true,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Contests" totalEntries={contests.length} />
      <DataTable columns={columns} data={contests} />
    </div>
  );
};

export default ContestsPage;
