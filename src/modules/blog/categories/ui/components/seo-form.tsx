"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/shared/ui/form";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { TextareaField } from "@/modules/blog/shared/components/textarea-field";
import { SwitchField } from "@/modules/blog/shared/components/switch-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import {
  categoryUpdateSeoSchema,
  type CategoryUpdateSeoValues,
} from "../../schemas";

import { useCategoriesFilters } from "../../hooks/use-categories-filters";

interface SeoFormProps {
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

export const SeoForm = ({ id, rootId, initialData }: SeoFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useCategoriesFilters();

  const form = useForm<CategoryUpdateSeoValues>({
    resolver: zodResolver(categoryUpdateSeoSchema),
    values: {
      ...initialData,
      id,
      rootId,
      description: initialData?.description ?? "",
      canonicalUrl: initialData?.canonicalUrl ?? "",
      ogTwitterTitle: initialData?.ogTwitterTitle ?? "",
      ogTwitterDescription: initialData?.ogTwitterDescription ?? "",
      noIndex: initialData?.noIndex === false ? false : true,
      noFollow: initialData?.noFollow === false ? false : true,
    },
    mode: "onChange",
  });

  const { mutate: updateCategorySeo, isPending } = useMutation(
    trpc.categories.updateSeo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.categories.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Category updated successfully");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateCategorySeo({
      ...dirtyData,
      id,
      rootId,
      noIndex: dirtyData.noIndex === false ? false : true,
      noFollow: dirtyData.noFollow === false ? false : true,
    });
  });

  const disabled = isPending;

  return (
    <Form {...form}>
      <form onChange={handleAutoSave} className="p-2 flex flex-col gap-y-4">
        <InputField
          control={form.control}
          name="title"
          label="Title"
          disabled={disabled}
          placeholder="Books"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          disabled={disabled}
          placeholder="In this category, you'll find articles about books."
        />
        <InputField
          control={form.control}
          name="canonicalUrl"
          label="Canonical URL"
          disabled={disabled}
          placeholder="https://site.com/canonical-url/"
        />
        <InputField
          control={form.control}
          name="ogTwitterTitle"
          label="OG / Twtitter Title"
          disabled={disabled}
          placeholder="Books"
        />
        <TextareaField
          control={form.control}
          name="ogTwitterDescription"
          label="OG / Twitter Description"
          disabled={disabled}
          placeholder="In this category, you'll find articles about books."
        />
        <SwitchField
          control={form.control}
          name="noIndex"
          label="No Index"
          description="Prevent all search engines that support the noindex rule from indexing this page."
          disabled={disabled}
        />
        <SwitchField
          control={form.control}
          name="noFollow"
          label="No Follow"
          description="Prevent all search engines that support the nofollow rule from following this page."
          disabled={disabled}
        />
      </form>
    </Form>
  );
};
