import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

export const useProductRootIdQuery = ({
  rootId,
  enabled = true,
}: {
  rootId?: string | null;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery({
    ...trpc.products.getPublishedByRootId.queryOptions({
      rootId: rootId ?? "",
    }),
    enabled: enabled && !!rootId,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
