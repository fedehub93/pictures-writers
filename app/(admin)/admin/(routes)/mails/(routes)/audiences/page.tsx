import { AudienceType } from "@prisma/client";
import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";

import { ContentHeader } from "@/components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { db } from "@/lib/db";

const ContactsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const lists = await db.emailAudience.findMany({
    include: {
      _count: {
        select: { contacts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalContacts = await db.emailContact.count();

  lists.unshift({
    id: "all",
    name: "All contacts",
    description: "All contacts",
    type: AudienceType.GLOBAL,
    emailSingleSendId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      contacts: totalContacts,
    },
  });

  const mappedLists = lists.map((list) => ({
    ...list,
    totalContacts: list._count.contacts,
  }));

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Audiences" totalEntries={mappedLists.length} />
      <DataTable columns={columns} data={mappedLists} />
    </div>
  );
};

export default ContactsPage;