import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { getSingleSends } from "@/modules/mails/single-sends/server/services/data";
import { SingleSendsView } from "@/modules/mails/single-sends/ui/views/single-sends-view";

const EmailSingleSends = async () => {
  await requireAdminAuth();

  const singleSends = await getSingleSends();

  return <SingleSendsView singleSends={singleSends} />;
};

export default EmailSingleSends;
