"use client";

import { z } from "zod";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form, FormMessage } from "@/shared/ui/form";

import { Button } from "@/shared/ui/button";

import { generateSlug } from "@/shared/lib/slug";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { SlugInput } from "@/shared/components/form-component/slug-input";

import {
  pageInsertSchema,
  PageInsertValues,
  PageUpdateValues,
} from "../../../schemas";

import { usePagesFilters } from "../../../hooks/use-pages-filters";

interface PageDetailsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: PageUpdateValues;
}

export const PageDetailsForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: PageDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePagesFilters();

  const form = useForm<z.infer<typeof pageInsertSchema>>({
    resolver: zodResolver(pageInsertSchema),
    values: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
    },
  });

  const updatePage = useMutation(
    trpc.pages.update.mutationOptions({
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

  const onSubmit = (values: PageInsertValues) => {
    if (isEdit) {
      updatePage.mutate({
        ...values,
        id: initialValues.id,
        rootId: initialValues.rootId,
      });
    }
  };

  const { field: fieldTitle } = useController({
    control: form.control,
    name: "title",
  });
  const { field: fieldSlug } = useController({
    control: form.control,
    name: "slug",
  });

  const onSlugCreate = () => {
    fieldSlug.onChange(generateSlug(fieldTitle.value));
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
        />
        <SlugInput
          control={form.control}
          name="slug"
          label="Slug"
          placeholder="about-us"
          disabled={isPending}
          buttonOnClick={onSlugCreate}
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
