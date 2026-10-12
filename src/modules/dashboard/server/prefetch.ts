import { prefetch, trpc } from "@/trpc/server";

/** Prefetches the current user's dashboard layout override. */
export const prefetchDashboardLayout = () => {
  return prefetch(trpc.dashboard.getLayout.queryOptions());
};
