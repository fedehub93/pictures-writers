import { prefetch, trpc } from "@/trpc/server";

/** Prefetches the integration provider list from the server caller. */
export const prefetchIntegrations = () => {
  return prefetch(trpc.integrations.getMany.queryOptions());
};
