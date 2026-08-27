"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/shared/ui/form";

import { InputField } from "@/modules/blog/shared/components/input-field";
import { SlugField } from "@/modules/blog/shared/components/slug-field";
import { TextareaField } from "@/modules/blog/shared/components/textarea-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { useCategoriesFilters } from "../../hooks/use-categories-filters";
import { categoryUpdateSchema, type CategoryUpdateValues } from "../../schemas";

interface CategoryDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    description: string | null;
    slug: string;
  } | null;
}

export const CategoryDetailsForm = ({
  id,
  rootId,
  initialData,
}: CategoryDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useCategoriesFilters();

  const form = useForm<CategoryUpdateValues>({
    resolver: zodResolver(categoryUpdateSchema),
    values: {
      ...initialData,
      id,
      rootId,
      description: initialData?.description ?? "",
    },
    mode: "onChange",
  });

  const { mutate: updateCategory, isPending } = useMutation(
    trpc.categories.update.mutationOptions({
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
    updateCategory({ id, rootId, ...dirtyData });
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
        <SlugField
          control={form.control}
          name="slug"
          disabled={disabled}
          sourceField="title"
          placeholder="books"
          getValues={form.getValues}
          setValue={form.setValue}
          onGenerate={handleAutoSave}
        />
      </form>
    </Form>
  );
};
