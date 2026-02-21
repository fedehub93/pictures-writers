import { db } from "@/lib/db";

import { EmailSingleSend } from "@/generated/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

type CustomeEmailAudience = { _count: { contacts: number } };

export type EmailSingleSendCustom = EmailSingleSend & {
  _count: { emailSingleSendLogs: number };
  audiences: CustomeEmailAudience[];
  totalContacts: number;
};

const EmailSingleSends = async () => {
  await requireAdminAuth();

  const singleSends = await db.emailSingleSend.findMany({
    include: {
      _count: {
        select: { emailSingleSendLogs: true },
      },
      audiences: {
        select: { _count: { select: { contacts: true } } },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedSingleSends: EmailSingleSendCustom[] = singleSends.map((s) => ({
    ...s, // Mantieni tutte le proprietà di 's'
    totalSends: s._count.emailSingleSendLogs,
    totalContacts: s.audiences.reduce(
      (total, a) => total + a._count.contacts,
      0,
    ), // Calcola il totale dei contatti
  }));

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader
        label="Email Single Sends"
        totalEntries={mappedSingleSends.length}
      />
      <DataTable columns={columns} data={mappedSingleSends} />
    </div>
  );
};

export default EmailSingleSends;
