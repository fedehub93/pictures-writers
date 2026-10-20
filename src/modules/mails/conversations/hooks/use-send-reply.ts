import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { invalidateConversationLists } from "./invalidate-conversation-lists";

/**
 * Send a reply inside a conversation. On success both the open thread and the
 * inbox list of the owning account are refreshed so the outbound message shows
 * up immediately.
 */
export const useSendReply = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.sendReply.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.conversations.getOne.queryFilter({ id: data.conversationId }),
        );
        queryClient.invalidateQueries(
          trpc.conversations.getCounts.queryFilter(),
        );
        // Every mailbox view is refreshed so the lists and counts stay exact.
        invalidateConversationLists(queryClient, trpc);
      },
    }),
  );
};
