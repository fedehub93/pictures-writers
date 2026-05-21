import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const WidgetsPage = async () => {
  await requireAdminAuth();

  const widgets = await db.widget.findMany({
    orderBy: {
      name: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Widgets" totalEntries={widgets.length} />
      <DataTable columns={columns} data={widgets} />
    </div>
  );
};

export default WidgetsPage;
