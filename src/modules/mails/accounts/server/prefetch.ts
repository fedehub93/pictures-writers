import { prefetch, trpc } from "@/trpc/server";

/**
 * Prefetch all email accounts
 */
export const prefetchEmailAccounts = () => {
  return prefetch(trpc.emailAccounts.getMany.queryOptions());
};

/**
 * Prefetch the accounts the current user is allowed to use in Conversations.
 */
export const prefetchAllowedEmailAccounts = () => {
  return prefetch(trpc.emailAccounts.getAllowed.queryOptions());
};
