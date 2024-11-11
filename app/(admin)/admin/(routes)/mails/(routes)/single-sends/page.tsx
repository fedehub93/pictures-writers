import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const EmailSingleSends = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const singleSends = await db.emailSingleSend.findMany({
    include: {
      _count: {
        select: { emailSingleSendLogs: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedsingleSends = singleSends.map((list) => ({
    ...list,
    totalSends: list._count.emailSingleSendLogs,
  }));

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader
        label="Email Single Sends"
        totalEntries={mappedsingleSends.length}
      />
      <DataTable columns={columns} data={mappedsingleSends} />
    </div>
  );
};

export default EmailSingleSends;
