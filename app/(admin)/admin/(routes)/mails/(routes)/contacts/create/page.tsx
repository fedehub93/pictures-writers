import { db } from "@/lib/db";
import { CreateContactForm } from "./_components/create-contact-form";

const ContactCreatePage = async () => {
  const audiences = await db.emailAudience.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const mappedAudiences: { label: string; value: string }[] = audiences.map(
    (audience) => ({
      label: audience.name,
      value: audience.id,
    })
  );

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your contact</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your contact? Don&apos;t worry, you can
          change this later.
        </p>
        <CreateContactForm options={mappedAudiences} />
      </div>
    </div>
  );
};

export default ContactCreatePage;
