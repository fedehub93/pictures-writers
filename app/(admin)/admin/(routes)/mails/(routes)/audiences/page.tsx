import { ContentHeader } from "@/components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { db } from "@/lib/db";
import { AudienceType } from "@prisma/client";

const ContactsPage = async () => {
  const lists = await db.emailAudience.findMany({
    include: {
      _count: {
        select: { contacts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (lists.length === 0) {
    const defaultList = await db.emailAudience.create({
      data: {
        name: "All contacts",
        type: AudienceType.GLOBAL,
      },
    });

    lists.push({ ...defaultList, _count: { contacts: 0 } });
  }

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
