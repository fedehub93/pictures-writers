import { db } from "@/lib/db";
import { WriteForm } from "./_components/write-form";
import { redirect } from "next/navigation";
import { getTodayEmailsAvailable } from "@/lib/mail";

const SingleSendIdPage = async (props: {
  params: Promise<{ singleSendId: string }>;
}) => {
  const params = await props.params;
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

  const todayEmailsAvailable = await getTodayEmailsAvailable();

  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">
      <WriteForm
        singleSend={singleSend}
        todayEmailsAvailable={todayEmailsAvailable}
        templates={templates}
      />
    </div>
  );
};

export default SingleSendIdPage;
