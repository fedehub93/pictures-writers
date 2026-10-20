import type { useQueryClient } from "@tanstack/react-query";

import type { useTRPC } from "@/trpc/client";

/**
 * Conversation lists are cached per view. Any shared or personal change can
 * move a thread between views, so invalidate the whole `getMany` key prefix.
 */
export function invalidateConversationLists(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
) {
  queryClient.invalidateQueries({
    queryKey: trpc.conversations.getMany.queryKey(),
  });
}
