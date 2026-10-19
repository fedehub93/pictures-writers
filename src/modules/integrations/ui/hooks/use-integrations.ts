import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSuspenseIntegrations = () => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.integrations.getMany.queryOptions());
};

export const useUpdateIntegration = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.integrations.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.integrations.getMany.queryOptions(),
        );
        toast.success("Integration updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};

export const useSetIntegrationEnabled = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.integrations.setEnabled.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.integrations.getMany.queryOptions(),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};

export const useTestIntegration = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.integrations.test.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.integrations.getMany.queryOptions(),
        );
        toast.success("Connection test succeeded");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};
