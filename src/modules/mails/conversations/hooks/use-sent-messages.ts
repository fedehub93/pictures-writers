import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Outbound messages for the selected account, newest send first. */
export const useSentMessages = (emailAccountId?: string, enabled = true) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getSentMessages.queryOptions(
      { emailAccountId: emailAccountId ?? "" },
      { enabled: enabled && Boolean(emailAccountId) },
    ),
  );
};
