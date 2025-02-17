import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { ContactRequestForm } from "./_components/contact-request-form";

const MailSettings = async ({ params }: { params: { contactId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const contact = await db.contactForm.findUnique({
    where: {
      id: params.contactId,
    },
  });

  if (!contact) {
    redirect(`/admin/contacts`);
  }

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto overflow-y-auto">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Contact</h1>
        </div>
      </div>
      <div className="bg-slate-100 dark:bg-background p-4 w-full rounded-md">
        <ContactRequestForm
          name={contact.name}
          email={contact.email}
          subject={contact.subject}
          message={contact.message}
        />
      </div>
    </div>
  );
};

export default MailSettings;
