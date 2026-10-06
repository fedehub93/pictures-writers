import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.reviews.getMany>;

// Hook to fetch the paginated review list using suspense
export const useSuspenseReviews = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.reviews.getMany.queryOptions({ ...params }));
};
