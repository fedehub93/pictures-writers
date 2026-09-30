"use server";

import { unsubscribeContactById } from "@/modules/mails/lib/core";

export const removeSubscription = async (id: string) => {
  const revoked = await unsubscribeContactById(id);

  if (!revoked) {
    return { error: "Email does not exist!" };
  }

  return { success: "Email removed!" };
};
