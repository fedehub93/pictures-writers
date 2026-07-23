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
  formInsertSchema,
  FormInsertValues,
  FormUpdateValues,
} from "../../schemas";
import { useFormFilters } from "../../hooks/use-forms-filter";

interface FormFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: FormUpdateValues;
}

export const FormForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: FormFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useFormFilters();

  const form = useForm<FormInsertValues>({
    resolver: zodResolver(formInsertSchema),
    values: {
      name: initialValues?.name ?? "",
      gtmLabel: initialValues?.gtmLabel ?? "",
      gtmEventName: initialValues?.gtmEventName ?? "",
      gtmCategory: initialValues?.gtmCategory ?? "",
    },
  });

  const createForm = useMutation(
    trpc.forms.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.forms.getMany.queryOptions(filters),
        );
        toast.success("Form created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateForm = useMutation(
    trpc.forms.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.forms.getMany.queryOptions(filters),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.forms.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        toast.success("Form updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = createForm.isPending || updateForm.isPending;

  const onSubmit = (values: FormInsertValues) => {
    if (isEdit) {
      updateForm.mutate({ ...values, id: initialValues.id });
    } else {
      createForm.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="John Doe"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="gtmLabel"
          label="GTM Label"
          placeholder="Form free download"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="gtmEventName"
          label="GTM Event Name"
          placeholder="form_free_download"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="gtmCategory"
          label="GTM Category"
          placeholder="lead"
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
