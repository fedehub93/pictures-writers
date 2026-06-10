"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

import { useTRPC } from "@/trpc/client";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { ComboboxDemo } from "@/shared/components/combo-box";

import { useSuspenseTemplates } from "@/modules/mails/templates/hooks/use-templates";

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

const SingleSendFormContent = ({
  onSuccess,
  onCancel,
  initialValues,
}: SingleSendFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: templates } = useSuspenseTemplates();

  const form = useForm<SingleSendInsertValues>({
    resolver: zodResolver(singleSendInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      emailTemplateId: initialValues?.emailTemplateId ?? "",
      audiences: [],
    },
  });

  const createSingleSend = useMutation(
    trpc.singleSends.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.singleSends.getMany.queryOptions(),
        );

        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createSingleSend.isPending;

  const onSubmit = (values: SingleSendInsertValues) => {
    createSingleSend.mutate(values);
  };

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

        <FormField
          control={form.control}
          name="emailTemplateId"
          render={({ field }) => (
            <FormItem className="flex-auto flex flex-col">
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
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const SingleSendForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: SingleSendFormProps) => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-40" />}>
      <SingleSendFormContent
        onSuccess={onSuccess}
        onCancel={onCancel}
        initialValues={initialValues}
      />
    </Suspense>
  );
};
