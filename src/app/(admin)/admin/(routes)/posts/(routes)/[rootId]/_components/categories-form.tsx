"use client";

import * as z from "zod";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

import { ContentStatus } from "@/generated/prisma";

import { cn } from "@/lib/utils";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

import { useCategoriesQuery } from "@/app/(admin)/_hooks/use-categories";
import { MultiSelectV2 } from "@/components/multi-select-v2";

interface CategoriesFormProps {
  initialData: {
    status: ContentStatus;
    postCategories: {
      category: {
        id: string;
        title: string;
      };
      sort: number;
    }[];
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1),
      sort: z.coerce.number<number>(),
    })
  ),
});

export const CategoriesForm = ({
  initialData,
  rootId,
  postId,
}: CategoriesFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const { data: categories, isError, isLoading } = useCategoriesQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: initialData.postCategories
        ? [
            ...initialData.postCategories.map((a) => ({
              id: a.category.id,
              sort: a.sort,
            })),
          ]
        : [],
    },
  });

  const { isValid, touchedFields, isSubmitting } = form.formState;

  const { field } = useController({
    control: form.control,
    name: "categories",
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

  const onSelectCategory = ({ id, sort }: { id: string; sort: number }) => {
    let newCategories = [...field.value];
    const author = field.value.find((v) => v.id === id);
    if (author) {
      newCategories = [...field.value.filter((v) => v.id !== id)];
    }
    if (!author) {
      newCategories.push({ id, sort });
    }
    field.onChange(newCategories);
    form.handleSubmit(onSubmit)();
  };

  if (isError) return <div>Error...</div>;

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid ||
          (initialData.postCategories.length === 0 && "border-l-red-500")
      )}
    >
      <div className="flex items-center justify-between">Categories</div>
      {isLoading && <Skeleton className="mt-4 w-full h-10" />}
      {!isLoading && categories && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem className="w-full flex flex-col">
                  <MultiSelectV2
                    label="Categories"
                    isSubmitting={isSubmitting}
                    values={field.value}
                    options={categories.map((c) => ({
                      id: c.id,
                      label: c.title,
                      status: c.status,
                    }))}
                    onSelectValue={onSelectCategory}
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
