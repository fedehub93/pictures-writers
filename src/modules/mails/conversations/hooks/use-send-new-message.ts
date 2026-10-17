import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Send a brand-new one-to-one message. On success the inbox list of the owning
 * account is refreshed so the new conversation appears immediately.
 */
export const useSendNewMessage = (emailAccountId?: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.conversations.sendNew.mutationOptions({
      onSuccess: () => {
        if (emailAccountId) {
          queryClient.invalidateQueries(
            trpc.conversations.getMany.queryFilter({ emailAccountId }),
          );
        }
      },
    }),
  );
};
