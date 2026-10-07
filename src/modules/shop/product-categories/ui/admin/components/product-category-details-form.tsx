"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { SlugField } from "@/modules/blog/shared/components/slug-field";
import { TextareaField } from "@/modules/blog/shared/components/textarea-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import {
  productCategoryUpdateSchema,
  type ProductCategoryUpdateValues,
} from "../../../schemas";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategoryDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    description: string | null;
    slug: string;
  } | null;
}

export const ProductCategoryDetailsForm = ({
  id,
  rootId,
  initialData,
}: ProductCategoryDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductCategoriesFilters();

  const form = useForm<ProductCategoryUpdateValues>({
    resolver: zodResolver(productCategoryUpdateSchema),
    values: {
      ...initialData,
      id,
      rootId,
      description: initialData?.description ?? "",
    },
    mode: "onChange",
  });

  const { mutate: updateCategory, isPending } = useMutation(
    trpc.productCategories.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Category updated successfully");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateCategory({ id, rootId, ...dirtyData });
  });

  return (
    <Form {...form}>
      <form onChange={handleAutoSave} className="p-2 flex flex-col gap-y-4">
        <InputField
          control={form.control}
          name="title"
          label="Title"
          disabled={isPending}
          placeholder="Ebooks"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          disabled={isPending}
          placeholder="In this category, you'll find our ebooks."
        />
        <SlugField
          control={form.control}
          name="slug"
          disabled={isPending}
          sourceField="title"
          placeholder="ebooks"
          getValues={form.getValues}
          setValue={form.setValue}
          onGenerate={handleAutoSave}
        />
      </form>
    </Form>
  );
};
