import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.posts.getMany>;

// Hook to fetch all posts using suspense
export const useSuspensePosts = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.posts.getMany.queryOptions({ ...params }));
};

// Hook to fetch a post using suspense
export const useSuspensePost = (rootId: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.posts.getLastByRootId.queryOptions({ rootId }));
};

export const usePostsQuery = () => {
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery({
    ...trpc.posts.getMany.queryOptions({}),
    enabled: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    data,
    isLoading,
    isError,
  };
};

export const usePostRootIdQuery = ({
  rootId,
  enabled = true,
}: {
  rootId?: string | null;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery({
    ...trpc.posts.getLastByRootId.queryOptions({ rootId: rootId ?? "" }),
    enabled,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
