"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { ComboboxDemo } from "@/shared/components/combo-box";
import { useGetEmailTemplates } from "@/app/(admin)/admin/(routes)/mails/(routes)/templates/_hooks/use-get-email-templates";
import { singleSendInsertSchema, SingleSendInsertValues } from "../../schemas";

interface SingleSendFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    name: string;
    emailTemplateId: string;
  };
}

export const SingleSendForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: SingleSendFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: templates, isLoading, isError } = useGetEmailTemplates();

  const form = useForm<SingleSendInsertValues>({
    resolver: zodResolver(singleSendInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      emailTemplateId: initialValues?.emailTemplateId ?? "",
    },
  });

  const updatePage = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & SingleSendInsertValues) => {
      return axios.patch(`/api/admin/mails/single-sends/${id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["single-sends"],
      });

      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["single-send", { id: initialValues.id }],
        });
      }

      toast.success("Single send updated successfully");
      router.refresh();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update the single send",
      );
    },
  });

  const createSingleSend = useMutation({
    mutationFn: (payload: z.infer<typeof singleSendInsertSchema>) => {
      return axios.post(`/api/admin/mails/single-sends`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["single-sends"] });

      router.refresh();
      toast.success("Single send created successfully");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create the single send",
      );
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = updatePage.isPending || createSingleSend.isPending;

  const onSubmit = (values: SingleSendInsertValues) => {
    if (isEdit) {
      updatePage.mutate({ ...values, id: initialValues.id });
    } else {
      createSingleSend.mutate(values);
    }
  };

  if (isError) {
    return <div className="flex flex-col gap-2">Error fetching templates.</div>;
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="Newsletter #48 del 2026 - Ultime news di Ottobre"
          disabled={isPending}
        />

        {!templates || isLoading ? (
          <Skeleton className="w-full h-10" />
        ) : (
          <FormField
            control={form.control}
            name="emailTemplateId"
            render={({ field }) => (
              <FormItem className="flex-auto">
                <FormLabel>Email template</FormLabel>
                <FormControl>
                  <ComboboxDemo
                    {...field}
                    options={templates.map((template) => ({
                      label: template.name,
                      value: template.id,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
