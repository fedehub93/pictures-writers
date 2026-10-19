import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Send a brand-new one-to-one message. On success the inbox lists of the owning
 * account are refreshed so the new conversation appears immediately.
 */
export const useSendNewMessage = (emailAccountId?: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.sendNew.mutationOptions({
      onSuccess: () => {
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
