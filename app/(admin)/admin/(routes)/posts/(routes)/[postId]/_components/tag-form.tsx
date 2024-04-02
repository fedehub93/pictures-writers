"use client";

import { Post, Tag } from "@prisma/client";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import MultipleSelector from "@/components/multi-select";
import { useDebounceCallback } from "usehooks-ts";

interface TagFormProps {
  initialData: Post & {
    tags: Tag[];
  };
  postId: string;
  options: { label: string; value: string; isPublished?: boolean }[];
}

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  isPublished: z.boolean().optional(),
});

const formSchema = z.object({
  tags: z.array(optionSchema),
});

export const TagForm = ({ initialData, postId, options }: TagFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: [
        ...initialData.tags.map((tag) => ({
          label: tag.title,
          value: tag.id,
          isPublished: tag.isPublished,
        })),
      ],
    },
  });

  const { isValid, touchedFields } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onChangeTag = (value: z.infer<typeof optionSchema>[]) => {
    form.setValue("tags", value);
    debouncedSubmit();
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.trigger("tags");
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">Tags</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <MultipleSelector
                      value={field.value}
                      onChange={onChangeTag}
                      defaultOptions={options}
                      placeholder="Select tags..."
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          no results found.
                        </p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </form>
      </Form>
    </div>
  );
};
