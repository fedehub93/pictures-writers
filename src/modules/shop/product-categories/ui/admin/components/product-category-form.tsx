"use client";

import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { generateSlug } from "@/shared/lib/slug";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { SlugInput } from "@/shared/components/form-component/slug-input";

import {
  productCategoryInsertSchema,
  type ProductCategoryInsertValues,
} from "../../../schemas";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductCategoryForm = ({
  onSuccess,
  onCancel,
}: ProductCategoryFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductCategoriesFilters();

  const form = useForm<ProductCategoryInsertValues>({
    resolver: zodResolver(productCategoryInsertSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  const createCategory = useMutation(
    trpc.productCategories.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        toast.success("Category created successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createCategory.isPending;

  const onSubmit = (values: ProductCategoryInsertValues) => {
    createCategory.mutate(values);
  };

  const { field: fieldTitle } = useController({
    control: form.control,
    name: "title",
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="title"
          label="Title"
          placeholder="Ebooks"
          disabled={isPending}
        />
        <SlugInput
          control={form.control}
          name="slug"
          label="Slug"
          placeholder="ebooks"
          disabled={isPending}
          buttonOnClick={() => form.setValue("slug", generateSlug(fieldTitle.value))}
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
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};
