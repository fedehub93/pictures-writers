import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.automations.getMany>;

// Hook to fetch all automations using suspense
export const useSuspenseAutomations = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.automations.getMany.queryOptions({ ...params }));
};

// Hook to fetch a single automation using suspense
export const useSuspenseAutomation = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.automations.getOne.queryOptions({ id }));
};

/**
 * Hook to update automation name
 */
export const useUpdateAutomationName = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.automations.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Automation "${data.name}" updated`);
        queryClient.invalidateQueries(
          trpc.automations.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.automations.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to update automation: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to update a automation
 */
export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.automations.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Automation "${data.name}" saved`);
        queryClient.invalidateQueries(
          trpc.automations.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.automations.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to save automation: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to execute a automation
 */
export const useExecuteAutomation = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.automations.execute.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Automation "${data.name}" executed`);
      },
      onError: (error) => {
        toast.error(`Failed to execute automation: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to publish a automation: validates the graph server-side, persists it
 * and stores the published snapshot.
 */
export const usePublishAutomation = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.automations.publish.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Automation "${data.name}" published`);
        queryClient.invalidateQueries(
          trpc.automations.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.automations.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to publish automation: ${error.message}`);
      },
    }),
  );
};