import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

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
