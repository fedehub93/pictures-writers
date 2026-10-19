import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Send a reply inside a conversation. On success both the open thread and the
 * inbox list of the owning account are refreshed so the outbound message shows
 * up immediately.
 */
export const useSendReply = (emailAccountId?: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.sendReply.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.conversations.getOne.queryFilter({ id: data.conversationId }),
        );

        if (emailAccountId) {
          // Both views are refreshed so the inbox/archived counts stay exact.
          for (const archived of [false, true]) {
            queryClient.invalidateQueries(
              trpc.conversations.getMany.queryFilter({
                emailAccountId,
                archived,
              }),
            );
          }
        }
      },
    }),
  );
};
