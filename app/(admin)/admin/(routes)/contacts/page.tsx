import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const ImpressionsPage = async () => {
  await requireAdminAuth();

  const contacts = await db.contactForm.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Contacts" totalEntries={contacts.length} />
      <DataTable columns={columns} data={contacts} />
    </div>
  );
};

export default ImpressionsPage;
