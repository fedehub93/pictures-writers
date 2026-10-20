import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { invalidateConversationLists } from "./invalidate-conversation-lists";

/**
 * Send a brand-new one-to-one message. On success the mailbox lists are
 * refreshed so the new conversation appears immediately.
 */
export const useSendNewMessage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.sendNew.mutationOptions({
      onSuccess: () => invalidateConversationLists(queryClient, trpc),
    }),
  );
};
