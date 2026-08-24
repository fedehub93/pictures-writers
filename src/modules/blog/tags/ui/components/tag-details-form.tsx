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

import { useTagsFilters } from "../../hooks/use-tags-filters";
import { tagUpdateSchema, type TagUpdateValues } from "../../schemas";

interface TagDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    description: string | null;
    slug: string;
  } | null;
}

export const TagDetailsForm = ({
  id,
  rootId,
  initialData,
}: TagDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useTagsFilters();

  const form = useForm<TagUpdateValues>({
    resolver: zodResolver(tagUpdateSchema),
    values: {
      ...initialData,
      id,
      rootId,
      description: initialData?.description ?? "",
    },
    mode: "onChange",
  });

  const { mutate: updateTag, isPending } = useMutation(
    trpc.tags.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.tags.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Tag updated successfully");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateTag({ id, rootId, ...dirtyData });
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
          placeholder="In this Tag, you'll find articles about books."
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
