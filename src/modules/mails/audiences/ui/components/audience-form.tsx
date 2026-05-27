"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form, FormMessage } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { useTRPC } from "@/trpc/client";

import { GenericInput } from "@/shared/components/form-component/generic-input";

import { audienceInsertSchema, AudienceInsertValues } from "../../schemas";

interface AudienceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    name: string;
  };
}

export const AudienceForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AudienceFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<AudienceInsertValues>({
    resolver: zodResolver(audienceInsertSchema),
    values: {
      name: initialValues?.name ?? "",
    },
  });

  const createAudience = useMutation(
    trpc.audiences.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.audiences.getMany.queryOptions(),
        );

        toast.success("Audience created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateAudience = useMutation(
    trpc.audiences.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.audiences.getMany.queryOptions(),
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.audiences.getOne.queryOptions({ id: initialValues.id }),
          );
        }

        toast.success("Audience updated successfully!");

        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = createAudience.isPending || updateAudience.isPending;

  const onSubmit = (values: AudienceInsertValues) => {
    if (isEdit) {
      updateAudience.mutate({ ...values, id: initialValues.id });
    } else {
      createAudience.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="Generic newsletter"
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
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
