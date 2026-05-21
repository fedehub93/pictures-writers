import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { getFormsByFilters } from "@/data/form";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/column";

const FormsPage = async () => {
  await requireAdminAuth();

  const forms = await getFormsByFilters({ where: {} });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Forms" totalEntries={forms.length} />
      <DataTable columns={columns} data={forms} />
    </div>
  );
};

export default FormsPage;
