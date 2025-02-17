import { authAdmin } from "@/lib/auth-service";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const AudienceIdContactsPage = async (
  props: {
    params: Promise<{ audienceId: string }>;
  }
) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
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
    include: { interactions: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Contacts" totalEntries={contacts.length} />
      <DataTable
        audienceId={params.audienceId}
        columns={columns}
        data={contacts}
      />
    </div>
  );
};

export default AudienceIdContactsPage;
