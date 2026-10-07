"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";

import { GenericTiptap } from "@/shared/components/form-component/generic-tiptap";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { SlugField } from "@/modules/blog/shared/components/slug-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { productUpdateSchema } from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

import { ProductCategorySelect } from "./product-category-select";

const formSchema = productUpdateSchema.pick({
  id: true,
  rootId: true,
  title: true,
  slug: true,
  categoryId: true,
  tiptapDescription: true,
});

type FormValues = z.infer<typeof formSchema>;

interface ProductDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    slug: string;
    categoryId: string | null;
    tiptapDescription: unknown;
  };
}

export const ProductDetailsForm = ({
  id,
  rootId,
  initialData,
}: ProductDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      title: initialData.title,
      slug: initialData.slug,
      categoryId: initialData.categoryId,
      tiptapDescription: initialData.tiptapDescription ?? {
        type: "doc",
        content: [],
      },
    },
    // Keep local edits when the suspense query re-fetches after an autosave,
    // so the TipTap body is not reverted to the server snapshot.
    resetOptions: { keepDirtyValues: true, keepDirty: true },
    mode: "onChange",
  });

  const { mutate: updateProduct, isPending } = useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("Product updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the product");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateProduct({ id, rootId, ...dirtyData });
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
        <ProductCategorySelect
          control={form.control}
          disabled={isPending}
          onChange={handleAutoSave}
        />
        <SlugField
          control={form.control}
          name="slug"
          disabled={isPending}
          sourceField="title"
          placeholder="screenplay-101"
          getValues={form.getValues}
          setValue={form.setValue}
          onGenerate={handleAutoSave}
        />
        <GenericTiptap
          id={id}
          control={form.control}
          name="tiptapDescription"
          onUpdate={handleAutoSave}
        />
      </form>
    </Form>
  );
};
