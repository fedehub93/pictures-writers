import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";
import { AudienceType } from "@prisma/client";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { ContentHeader } from "@/components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const AudienceIdContactsPage = async ({
  params,
}: {
  params: { audienceId: string };
}) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const contacts = await db.emailContact.findMany({
    where: {
      audiences:
        params.audienceId.toUpperCase() !== "ALL"
          ? {
              some: {
                id: params.audienceId,
              },
            }
          : undefined,
    },
    orderBy: { email: "asc" },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Contacts" totalEntries={contacts.length} />
      <DataTable columns={columns} data={contacts} />
    </div>
  );
};

export default AudienceIdContactsPage;
