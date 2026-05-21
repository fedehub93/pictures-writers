"use client";

import { ContentStatus } from "@/generated/prisma";
import * as z from "zod";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import { useTagssQuery } from "@/app/(admin)/_hooks/use-tags-query";
import { MultiSelectV2 } from "@/components/multi-select-v2";

interface TagsFormProps {
  initialData: {
    status: ContentStatus;
    tags: {
      id: string;
    }[];
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  tags: z.array(
    z.object({
      id: z.string().min(1),
    })
  ),
});

export const TagsForm = ({ initialData, rootId, postId }: TagsFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const { data: tags, isError, isLoading } = useTagssQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: initialData.tags
        ? [
            ...initialData.tags.map((t) => ({
              id: t.id,
            })),
          ]
        : [],
    },
  });

  const { isValid, touchedFields, isSubmitting } = form.formState;

  const { field } = useController({
    control: form.control,
    name: "tags",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`/api/posts/${rootId}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`/api/posts/${rootId}/versions/${postId}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onSelectTag = ({ id }: { id: string }) => {
    let newTags = [...field.value];
    const tag = field.value.find((v) => v.id === id);
    if (tag) {
      newTags = [...field.value.filter((v) => v.id !== id)];
    }
    if (!tag) {
      newTags.push({ id });
    }
    field.onChange(newTags);
    form.handleSubmit(onSubmit)();
  };

  if (isError) return <div>Error...</div>;

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500"
      )}
    >
      <div className="flex items-center justify-between">Tags</div>
      {isLoading && <Skeleton className="mt-4 w-full h-10" />}
      {!isLoading && tags && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="w-full flex flex-col">
                  <MultiSelectV2
                    label="tags"
                    isSubmitting={isSubmitting}
                    values={field.value}
                    options={tags.map((t) => ({
                      id: t.id,
                      label: t.title,
                      status: t.status,
                    }))}
                    onSelectValue={onSelectTag}
                    showValuesInButton
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}
    </div>
  );
};
