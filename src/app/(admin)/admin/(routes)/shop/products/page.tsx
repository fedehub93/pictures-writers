import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const ProductsPage = async () => {
  await requireAdminAuth();

  const products = await db.product.findMany({
    include: {
      imageCover: true,
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["rootId"],
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Products" totalEntries={products.length} />
      <DataTable columns={columns} data={products} />
    </div>
  );
};

export default ProductsPage;
