import { db } from "@/lib/db";
import { WriteForm } from "./write-form";
import { redirect } from "next/navigation";

const SingleSendIdPage = async ({
  params,
}: {
  params: { singleSendId: string };
}) => {
  const singleSend = await db.emailSingleSend.findUnique({
    where: {
      id: params.singleSendId,
    },
    include: {
      audiences: true,
    },
  });

  if (!singleSend) {
    return redirect(`/admin/mails/single-sends`);
  }

  const templates = await db.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  const audiences = await db.emailAudience.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">
      <WriteForm
        singleSend={singleSend}
        templates={templates}
        options={audiences.map((audience) => ({
          label: audience.name,
          value: audience.id,
        }))}
      />
    </div>
  );
};

export default SingleSendIdPage;
