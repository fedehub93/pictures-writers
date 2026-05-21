import { SingleSendIdView } from "@/modules/mails/single-sends/ui/views/single-send-id-view";

const SingleSendIdPage = async ({
  params,
}: {
  params: Promise<{ singleSendId: string }>;
}) => {
  const { singleSendId } = await params;

  return <SingleSendIdView singleSendId={singleSendId} />;
};

export default SingleSendIdPage;
