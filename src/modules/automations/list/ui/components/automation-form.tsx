"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import {
  automationCreateSchema,
  type AutomationCreateValues,
} from "../../../schemas";

import { useAutomationsFilters } from "../../../hooks/use-automations-filters";

interface AutomationFormProps {
  data?: Partial<{ id: string; name: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AutomationForm = ({
  data,
  onSuccess,
  onCancel,
}: AutomationFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useAutomationsFilters();

  const form = useForm<AutomationCreateValues>({
    resolver: zodResolver(automationCreateSchema),
    defaultValues: {
      name: data?.name ?? "",
    },
  });

  const invalidateAutomations = () => {
    return queryClient.invalidateQueries(
      trpc.automations.getMany.queryFilter(filters),
    );
  };

  const createAutomation = useMutation(
    trpc.automations.create.mutationOptions({
      onSuccess: async () => {
        await invalidateAutomations();
        toast.success("Automation created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateAutomation = useMutation(
    trpc.automations.updateName.mutationOptions({
      onSuccess: async () => {
        await invalidateAutomations();
        toast.success("Automation renamed successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createAutomation.isPending || updateAutomation.isPending;

  const onSubmit = (values: AutomationCreateValues) => {
    if (data?.id) {
      updateAutomation.mutate({ id: data.id, ...values });
    } else {
      createAutomation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="Nurture emails"
          disabled={isPending}
        />

        <div className="flex justify-between gap-x-2 mt-8">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
              <FormMessage />
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {data?.id ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
