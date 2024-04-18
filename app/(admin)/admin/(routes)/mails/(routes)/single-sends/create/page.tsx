import { db } from "@/lib/db";
import SingleSendCreateForm from "./_components/single-send-create-form";

const SingleSendCreatePage = async () => {
  const templates = await db.emailTemplate.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <SingleSendCreateForm templates={templates} />;
};

export default SingleSendCreatePage;
