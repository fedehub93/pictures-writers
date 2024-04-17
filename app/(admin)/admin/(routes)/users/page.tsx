import { redirectToSignIn } from "@clerk/nextjs";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { EditUserModal } from "@/app/(admin)/_components/modals/edit-user-modal";

const UsersPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
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
