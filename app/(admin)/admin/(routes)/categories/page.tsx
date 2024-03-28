import { redirectToSignIn } from "@clerk/nextjs";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { DataTable } from "./(routes)/_components/data-table";
import { columns } from "./(routes)/_components/columns";

const CategoriesPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const categories = await db.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl">Categories</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} entry found
          </p>
        </div>
      </div>
      <DataTable columns={columns} data={categories} />
    </div>
  );
};

export default CategoriesPage;
