"use client";

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

import { tagInsertSchema, TagInsertValues } from "../../schemas";

import { useTagsFilters } from "../../hooks/use-tags-filters";

interface TagFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TagForm = ({ onSuccess, onCancel }: TagFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = useTagsFilters();

  const form = useForm<TagInsertValues>({
    resolver: zodResolver(tagInsertSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  const createTag = useMutation(
    trpc.tags.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.tags.getMany.queryOptions(filters),
        );
        toast.success("Tag created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createTag.isPending;

  const onSubmit = (values: TagInsertValues) => {
    createTag.mutate(values);
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
