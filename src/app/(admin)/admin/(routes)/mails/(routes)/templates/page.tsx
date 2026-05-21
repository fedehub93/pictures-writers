import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const EmailTemplates = async () => {
  await requireAdminAuth();

  const templates = await db.emailTemplate.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Email Templates" totalEntries={templates.length} />
      <DataTable columns={columns} data={templates} />
    </div>
  );
};

export default EmailTemplates;
