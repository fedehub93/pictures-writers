import { prefetch, trpc } from "@/trpc/server";

/** Prefetches the current user's dashboard layout override. */
export const prefetchDashboardLayout = () => {
  return prefetch(trpc.dashboard.getLayout.queryOptions());
};

/** Prefetches the metrics the current user is permitted to read. */
export const prefetchDashboardMetrics = () => {
  return prefetch(trpc.dashboard.getMetrics.queryOptions());
};

/** Prefetches the dynamic forms a Trend may narrow its submissions metric to. */
export const prefetchDashboardFormOptions = () => {
  return prefetch(trpc.dashboard.getFormOptions.queryOptions());
};
