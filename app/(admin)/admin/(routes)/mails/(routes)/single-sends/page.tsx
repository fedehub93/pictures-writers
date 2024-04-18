import { redirectToSignIn } from "@clerk/nextjs";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { ContentHeader } from "@/components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const EmailSingleSends = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const singleSends = await db.emailSingleSend.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Email Single Sends" totalEntries={singleSends.length} />
      <DataTable columns={columns} data={singleSends} />
    </div>
  );
};

export default EmailSingleSends;
