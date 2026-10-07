"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { SwitchField } from "@/modules/blog/shared/components/switch-field";
import { TextareaField } from "@/modules/blog/shared/components/textarea-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import {
  productUpdateSeoSchema,
  type ProductUpdateSeoValues,
} from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

interface ProductSeoFormProps {
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

export const ProductSeoForm = ({
  id,
  rootId,
  initialData,
}: ProductSeoFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  const form = useForm<ProductUpdateSeoValues>({
    resolver: zodResolver(productUpdateSeoSchema),
    values: {
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

  const { mutate: updateProductSeo, isPending } = useMutation(
    trpc.products.updateSeo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("SEO updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the SEO");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateProductSeo({
      ...form.getValues(),
      ...dirtyData,
      id,
      rootId,
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
          placeholder="Screenplay 101 Ebook"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          disabled={isPending}
          placeholder="This ebook talks about..."
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
          placeholder="Screenplay 101 Ebook"
        />
        <TextareaField
          control={form.control}
          name="ogTwitterDescription"
          label="OG / Twitter Description"
          disabled={isPending}
          placeholder="This ebook talks about..."
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
