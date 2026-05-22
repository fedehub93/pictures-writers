import { getTodayEmailsAvailable } from "@/modules/mails/lib/mail";

import { WriteForm } from "../components/write-form";
import { getSingleSendById } from "../../server/services/data";

export const SingleSendIdView = async ({
  singleSendId,
}: {
  singleSendId: string;
}) => {
  const singleSend = await getSingleSendById(singleSendId);
  const todayEmailsAvailable = await getTodayEmailsAvailable();

  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">
      <WriteForm
        singleSend={singleSend}
        todayEmailsAvailable={todayEmailsAvailable}
      />
    </div>
  );
};
