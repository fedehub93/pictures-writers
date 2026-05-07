"use client";

import { z } from "zod";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Form, FormMessage } from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import { GenericInput } from "@/components/form-component/generic-input";
import { pageInsertSchema, pageUpdateSchema } from "../schema";
import { SlugInput } from "@/components/form-component/slug-input";
import slugify from "slugify";

interface PageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    title: string;
    slug: string;
  };
}

export const PageForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: PageFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof pageInsertSchema>>({
    resolver: zodResolver(pageInsertSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
    },
  });

  const updatePage = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & z.infer<typeof pageUpdateSchema>) => {
      return axios.patch(`/api/admin/pages/${id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["pages"],
      });

      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["page", { id: initialValues.id }],
        });
      }

      toast.success("Page updated successfully");
      router.refresh();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update page");
    },
  });

  const createPage = useMutation({
    mutationFn: (payload: z.infer<typeof pageInsertSchema>) => {
      return axios.post(`/api/admin/pages`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pages"] });

      router.refresh();
      toast.success("Page created successfully");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create page");
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = updatePage.isPending || createPage.isPending;

  const onSubmit = (values: z.infer<typeof pageInsertSchema>) => {
    if (isEdit) {
      updatePage.mutate({ ...values, id: initialValues.id });
    } else {
      createPage.mutate(values);
    }
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
    fieldSlug.onChange(
      slugify(fieldTitle.value, {
        lower: true,
      }),
    );
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
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
