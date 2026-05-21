import { requireAdminAuth } from "@/lib/auth-utils";

import { getSingleSends } from "./data";
import { SingleSendsView } from "./_components/single-sends-view";

const EmailSingleSends = async () => {
  await requireAdminAuth();

  const singleSends = await getSingleSends();

  return <SingleSendsView singleSends={singleSends} />;
};

export default EmailSingleSends;
