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

import { categoryInsertSchema, CategoryInsertValues } from "../../schemas";

import { useCategoriesFilters } from "../../hooks/use-categories-filters";

interface CategoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CategoryForm = ({ onSuccess, onCancel }: CategoryFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useCategoriesFilters();

  const form = useForm<CategoryInsertValues>({
    resolver: zodResolver(categoryInsertSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  const createCategory = useMutation(
    trpc.categories.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.categories.getMany.queryOptions(filters),
        );
        toast.success("Category created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createCategory.isPending;

  const onSubmit = (values: CategoryInsertValues) => {
    createCategory.mutate(values);
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
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};
