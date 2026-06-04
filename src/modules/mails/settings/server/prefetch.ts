import { prefetch, trpc } from "@/trpc/server";

/**
 * Prefetch all Email Settings
 */
export const prefetchMailSettings = () => {
  return prefetch(trpc.mailSettings.get.queryOptions());
};
