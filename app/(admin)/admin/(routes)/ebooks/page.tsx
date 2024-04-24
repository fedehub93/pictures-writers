import { redirectToSignIn } from "@clerk/nextjs";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const EbooksPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const ebooks = await db.ebook.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Ebooks" totalEntries={ebooks.length} />
      <DataTable columns={columns} data={ebooks} />
    </div>
  );
};

export default EbooksPage;
