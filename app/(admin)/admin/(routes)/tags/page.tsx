import { auth } from "@clerk/nextjs/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { ContentHeader } from "@/components/content/content-header";

import { DataTable } from "./(routes)/_components/data-table";
import { columns } from "./(routes)/_components/columns";

const TagsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const tags = await db.tag.findMany({
    orderBy: {
      title: "asc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Tags" totalEntries={tags.length} />
      <DataTable columns={columns} data={tags} />
    </div>
  );
};

export default TagsPage;
