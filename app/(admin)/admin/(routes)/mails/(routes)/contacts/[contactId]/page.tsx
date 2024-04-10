import { AudienceType, EmailAudience, EmailContact } from "@prisma/client";
import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";
import { db } from "@/lib/db";

import { EditContactForm } from "./_components/edit-contact-form";
import { redirect } from "next/navigation";

const MailSettings = async ({ params }: { params: { contactId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const contact = await db.emailContact.findUnique({
    where: {
      id: params.contactId,
    },
    include: {
      audiences: true,
    },
  });

  if (!contact) {
    redirect(`/admin/mails/audiences`);
  }

  const audiences = await db.emailAudience.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto overflow-y-auto">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Contact</h1>
        </div>
      </div>
      <EditContactForm
        contact={contact}
        options={audiences.map((audience) => ({
          label: audience.name,
          value: audience.id,
        }))}
      />
    </div>
  );
};

export default MailSettings;
