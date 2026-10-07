"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { TextareaField } from "@/modules/blog/shared/components/textarea-field";
import { SwitchField } from "@/modules/blog/shared/components/switch-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import {
  productCategoryUpdateSeoSchema,
  type ProductCategoryUpdateSeoValues,
} from "../../../schemas";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategorySeoFormProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    description: string | null;
    canonicalUrl: string | null;
    ogTwitterTitle: string | null;
    ogTwitterDescription: string | null;
    noIndex: boolean;
    noFollow: boolean;
  } | null;
}

export const ProductCategorySeoForm = ({
  id,
  rootId,
  initialData,
}: ProductCategorySeoFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductCategoriesFilters();

  const form = useForm<ProductCategoryUpdateSeoValues>({
    resolver: zodResolver(productCategoryUpdateSeoSchema),
    values: {
      ...initialData,
      id,
      rootId,
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      canonicalUrl: initialData?.canonicalUrl ?? "",
      ogTwitterTitle: initialData?.ogTwitterTitle ?? "",
      ogTwitterDescription: initialData?.ogTwitterDescription ?? "",
      noIndex: initialData?.noIndex ?? false,
      noFollow: initialData?.noFollow ?? false,
    },
    mode: "onChange",
  });

  const { mutate: updateCategorySeo, isPending } = useMutation(
    trpc.productCategories.updateSeo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("SEO updated successfully");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateCategorySeo({
      ...dirtyData,
      id,
      rootId,
      noIndex: dirtyData.noIndex ?? false,
      noFollow: dirtyData.noFollow ?? false,
    });
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
        <InputField
          control={form.control}
          name="canonicalUrl"
          label="Canonical URL"
          disabled={isPending}
          placeholder="https://site.com/canonical-url/"
        />
        <InputField
          control={form.control}
          name="ogTwitterTitle"
          label="OG / Twitter Title"
          disabled={isPending}
          placeholder="Ebooks"
        />
        <TextareaField
          control={form.control}
          name="ogTwitterDescription"
          label="OG / Twitter Description"
          disabled={isPending}
          placeholder="In this category, you'll find our ebooks."
        />
        <SwitchField
          control={form.control}
          name="noIndex"
          label="No Index"
          description="Prevent all search engines that support the noindex rule from indexing this page."
          disabled={isPending}
        />
        <SwitchField
          control={form.control}
          name="noFollow"
          label="No Follow"
          description="Prevent all search engines that support the nofollow rule from following this page."
          disabled={isPending}
        />
      </form>
    </Form>
  );
};
