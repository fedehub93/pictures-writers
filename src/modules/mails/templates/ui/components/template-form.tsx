"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import { templateInsertSchema, TemplateInsertValues } from "../../schemas";

interface TemplateFormProps {
  onSuccess?: (templateId: string) => void;
  onCancel?: () => void;
}

export const TemplateForm = ({ onSuccess, onCancel }: TemplateFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<TemplateInsertValues>({
    resolver: zodResolver(templateInsertSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createTemplate = useMutation(
    trpc.templates.create.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.templates.getMany.queryOptions(),
        );
        toast.success("Template created successfully");
        onSuccess?.(data.id);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create template");
      },
    }),
  );

  const isPending = createTemplate.isPending;

  const onSubmit = (values: TemplateInsertValues) => {
    createTemplate.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="Newsletter Template"
          disabled={isPending}
        />

        <GenericInput
          control={form.control}
          name="description"
          label="Description (optional)"
          placeholder="Describe this template..."
          disabled={isPending}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createTemplate.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={createTemplate.isPending}>
            Create Template
          </Button>
        </div>
      </form>
    </Form>
  );
};
