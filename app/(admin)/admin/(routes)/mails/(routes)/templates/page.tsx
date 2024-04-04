import { redirectToSignIn } from "@clerk/nextjs";

import { db } from "@/lib/db";
import { ContentHeader } from "@/components/content/content-header";
import { authAdmin } from "@/lib/auth-service";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const EmailTemplates = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const templates = await db.emailTemplate.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Email Templates" totalEntries={0} />
      <DataTable columns={columns} data={templates} />
    </div>
  );
};

export default EmailTemplates;
