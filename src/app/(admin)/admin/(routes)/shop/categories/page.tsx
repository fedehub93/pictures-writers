import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./(routes)/_components/data-table";
import { columns } from "./(routes)/_components/columns";

const ProductCategoriesPage = async () => {
  await requireAdminAuth();

  const categories = await db.productCategory.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["rootId"],
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader
        label="Product Categories"
        totalEntries={categories.length}
      />
      <DataTable columns={columns} data={categories} />
    </div>
  );
};

export default ProductCategoriesPage;
