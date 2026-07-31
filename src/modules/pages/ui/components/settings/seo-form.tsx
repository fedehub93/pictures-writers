"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form, FormMessage } from "@/shared/ui/form";

import { Button } from "@/shared/ui/button";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import { pageUpdateSeoSchema, PageUpdateSeoValues } from "../../../schemas";

import { usePagesFilters } from "../../../hooks/use-pages-filters";

interface PageSeoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: PageUpdateSeoValues;
}

export const PageSeoForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: PageSeoFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePagesFilters();

  const form = useForm<z.infer<typeof pageUpdateSeoSchema>>({
    resolver: zodResolver(pageUpdateSeoSchema),
    values: {
      ...initialValues,
      id: initialValues?.id ?? "",
      rootId: initialValues?.rootId ?? "",
      noIndex: initialValues ? initialValues.noIndex : false,
      noFollow: initialValues ? initialValues.noFollow : false,
    },
  });

  const updatePage = useMutation(
    trpc.pages.updateSeo.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pages.getMany.queryOptions(filters),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.pages.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        toast.success("Page updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = updatePage.isPending;

  const onSubmit = (values: PageUpdateSeoValues) => {
    if (isEdit) {
      updatePage.mutate({
        ...values,
        id: initialValues.id,
        rootId: initialValues.rootId,
      });
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="title"
          label="Title"
          placeholder="About Us"
          disabled={isPending}
          charsCounter
        />

        <GenericTextarea
          control={form.control}
          name="description"
          label="Description"
          placeholder="This article shows you how to write..."
          disabled={isPending}
          charsCounter
        />

        <GenericInput
          control={form.control}
          name="canonicalUrl"
          label="Canonical URL"
          placeholder={process.env.NEXT_PUBLIC_APP_URL}
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="ogTwitterTitle"
          label="Open Graph / Twitter Title"
          placeholder="About Us"
          disabled={isPending}
        />
        <GenericTextarea
          control={form.control}
          name="ogTwitterDescription"
          label="Open Graph / Twitter Description"
          placeholder="This article shows you how to write..."
          disabled={isPending}
        />
        <div className="p-4 border rounded">
          <GenericSwitch
            control={form.control}
            name="noIndex"
            label="Prevent all search engines that support the noindex rule from indexing this page."
          />
        </div>
        <div className="p-4 border rounded">
          <GenericSwitch
            control={form.control}
            name="noFollow"
            label="Prevent all search engines that support the noFollow rule from follow the links on this page."
          />
        </div>
        <div className="flex justify-between gap-x-2 mt-8 pb-8">
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
