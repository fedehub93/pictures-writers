"use client";

import { Category, ContentStatus, Post } from "@prisma/client";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CategoryFormProps {
  initialData: Post & {
    category: Category | null;
  };
  rootId: string;
  postId: string;
  options: { label: string; value: string; status: ContentStatus }[];
}

const formSchema = z.object({
  categoryId: z.string().min(1),
});

export const CategoryForm = ({
  initialData,
  rootId,
  postId,
  options,
}: CategoryFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedOption, setSelectedOptions] = useState(
    options.find((option) => option.value === initialData.category?.id)
  );

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: { categoryId: initialData?.categoryId || "" },
  });

  const { isValid, touchedFields } = form.formState;

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

  const onChangeCategory = (value: string) => {
    form.setValue("categoryId", value);
    form.trigger("categoryId");
    setSelectedOptions(options.find((options) => options.value === value));
    debouncedSubmit();
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid && touchedFields.categoryId && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">
        Category
        {initialData.category && (
          <Badge
            className={cn(
              "bg-sky-700",
              selectedOption?.status === ContentStatus.CHANGED &&
                "bg-slate-500",
              selectedOption?.status === ContentStatus.DRAFT && "bg-red-500"
            )}
          >
            {selectedOption?.status === ContentStatus.PUBLISHED
              ? "Published"
              : selectedOption?.status === ContentStatus.CHANGED
              ? "Changed"
              : "Draft"}
          </Badge>
        )}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={onChangeCategory}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option) => {
                      return (
                        <SelectItem
                          key={option.label}
                          value={option.value}
                          className="w-full flex items-center justify-between"
                        >
                          {option.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
