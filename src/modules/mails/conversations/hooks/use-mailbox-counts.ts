import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Unread and archived totals for every account the caller may access. Polled so
 * the sidebar badge stays roughly current without a page reload.
 */
export const useMailboxCounts = (enabled = true) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getCounts.queryOptions(undefined, {
      enabled,
      refetchInterval: 30_000,
    }),
  );
};
