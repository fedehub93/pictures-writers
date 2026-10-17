import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

/**
 * Active email accounts the current user is allowed to use. Used by the
 * Conversations account selector; a user with no assignment sees none.
 */
export const useSuspenseAllowedEmailAccounts = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.emailAccounts.getAllowed.queryOptions());
};
