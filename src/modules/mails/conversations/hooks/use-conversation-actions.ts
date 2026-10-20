import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Read state affects every list view, the counts and the open conversation. */
function invalidateReadState(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  id: string,
) {
  queryClient.invalidateQueries({
    queryKey: trpc.conversations.getMany.queryKey(),
  });
  queryClient.invalidateQueries(trpc.conversations.getCounts.queryFilter());
  queryClient.invalidateQueries(
    trpc.conversations.getOne.queryFilter({ id }),
  );
}

/** Archive or unarchive a conversation. */
export const useSetConversationArchived = (emailAccountId?: string) => {
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

        if (emailAccountId) {
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

/** Soft-delete a conversation. */
export const useRemoveConversation = (emailAccountId?: string) => {
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

        if (emailAccountId) {
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
