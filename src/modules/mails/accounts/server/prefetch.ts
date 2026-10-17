import { prefetch, trpc } from "@/trpc/server";

/**
 * Prefetch all email accounts
 */
export const prefetchEmailAccounts = () => {
  return prefetch(trpc.emailAccounts.getMany.queryOptions());
};
