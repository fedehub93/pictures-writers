import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { invalidateConversationLists } from "./invalidate-conversation-lists";

/** Read state affects every list view, the counts and the open conversation. */
function invalidateReadState(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  id: string,
) {
  invalidateConversationLists(queryClient, trpc);
  queryClient.invalidateQueries(trpc.conversations.getCounts.queryFilter());
  queryClient.invalidateQueries(
    trpc.conversations.getOne.queryFilter({ id }),
  );
}

/** Archive or unarchive a conversation. */
export const useSetConversationArchived = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.setArchived.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.conversations.getOne.queryFilter({ id: data.id }),
        );
        queryClient.invalidateQueries(
          trpc.conversations.getCounts.queryFilter(),
        );
        invalidateConversationLists(queryClient, trpc);
      },
    }),
  );
};

/** Soft-delete a conversation. */
export const useRemoveConversation = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.remove.mutationOptions({
      onSuccess: (data) => {
        queryClient.removeQueries(
          trpc.conversations.getOne.queryFilter({ id: data.id }),
        );
        queryClient.invalidateQueries(
          trpc.conversations.getCounts.queryFilter(),
        );
        invalidateConversationLists(queryClient, trpc);
      },
    }),
  );
};

/** Move the caller's read watermark to now. */
export const useMarkConversationRead = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.markRead.mutationOptions({
      onSuccess: (data) => invalidateReadState(queryClient, trpc, data.id),
    }),
  );
};

/** Clear the caller's read watermark so all inbound mail is unread again. */
export const useMarkConversationUnread = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.markUnread.mutationOptions({
      onSuccess: (data) => invalidateReadState(queryClient, trpc, data.id),
    }),
  );
};

/** Star or unstar a conversation for the caller. */
export const useSetConversationStarred = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.setStarred.mutationOptions({
      onSuccess: (data) => {
        invalidateConversationLists(queryClient, trpc);
        queryClient.invalidateQueries(
          trpc.conversations.getOne.queryFilter({ id: data.id }),
        );
      },
    }),
  );
};

/** Create an `EmailContact` from a conversation's sender and link it. */
export const useCreateContactFromConversation = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.createContact.mutationOptions({
      onSuccess: (_contact, variables) => {
        queryClient.invalidateQueries(
          trpc.conversations.getOne.queryFilter({ id: variables.id }),
        );
      },
    }),
  );
};
