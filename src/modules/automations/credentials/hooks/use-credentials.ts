import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import {
  useCredentialsFilters,
  type CredentialsFilters,
} from "./use-credentials-filters";

export const useSuspenseCredentials = (filters?: CredentialsFilters) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.credentials.getMany.queryOptions(filters ?? { page: 1, pageSize: 10 }),
  );
};

export const useCreateCredential = () => {
  const [filters] = useCredentialsFilters();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryFilter(filters),
        );
      },
    }),
  );
};

export const useUpdateCredential = () => {
  const [filters] = useCredentialsFilters();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryFilter(filters),
        );
      },
    }),
  );
};

export const useDeleteCredential = () => {
  const [filters] = useCredentialsFilters();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryFilter(filters),
        );
      },
    }),
  );
};
