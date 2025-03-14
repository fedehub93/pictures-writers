import { authAdmin } from "@/lib/auth-service";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

import { EditContactForm } from "./_components/edit-contact-form";
import { redirect } from "next/navigation";

const MailSettings = async (props: {
  params: Promise<{ contactId: string }>;
}) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const contact = await db.emailContact.findUnique({
    where: {
      id: params.contactId,
    },
    include: {
      audiences: true,
      interactions: true,
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

  const interactions = [
    {
      label: "user_subscribed",
      value: "user_subscribed",
    },
    {
      label: "first_feedback_request",
      value: "first_feedback_request",
    },
    {
      label: "ebook_downloaded",
      value: "ebook_downloaded",
    },
    {
      label: "webinar_purchased",
      value: "webinar_purchased",
    },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3 max-w-6xl mx-auto overflow-y-auto">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-bold">Contact</h1>
        </div>
      </div>
      <EditContactForm contact={contact} interactionOptions={interactions} />
    </div>
  );
};

export default MailSettings;
