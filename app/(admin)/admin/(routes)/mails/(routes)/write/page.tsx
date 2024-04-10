import { WriteForm } from "./_components/write-form";
import { db } from "@/lib/db";

const WriteMail = async () => {
  const templates = await db.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="py-2 px-6 mx-auto h-full flex flex-col overflow-auto">

      <WriteForm templates={templates} />
    </div>
  );
};

export default WriteMail;
