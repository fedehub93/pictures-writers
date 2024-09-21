import { auth } from "@clerk/nextjs/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { EditUserModal } from "@/app/(admin)/_components/modals/edit-user-modal";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const UsersPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Users" totalEntries={users.length} />
      <DataTable columns={columns} data={users} />
      <EditUserModal />
    </div>
  );
};

export default UsersPage;
