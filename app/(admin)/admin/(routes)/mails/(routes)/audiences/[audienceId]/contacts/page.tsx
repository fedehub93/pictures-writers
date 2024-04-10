import { ContentHeader } from "@/components/content/content-header";
import { db } from "@/lib/db";
import { AudienceType } from "@prisma/client";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const AudienceIdContactsPage = async ({
  params,
}: {
  params: { audienceId: string };
}) => {
  let audienceId = params.audienceId;
  if (audienceId === "all") {
    const allContactsAudience = await db.emailAudience.findFirst({
      where: { type: AudienceType.GLOBAL },
    });

    if (!allContactsAudience) {
      redirect(`/admin/mails/audiences`);
    }

    audienceId = allContactsAudience.id;
  }

  const contacts = await db.emailContact.findMany({
    where: {
      audiences: {
        some: {
          id: audienceId,
        },
      },
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Contacts" totalEntries={contacts.length} />
      <DataTable columns={columns} data={contacts} />
    </div>
  );
};

export default AudienceIdContactsPage;
