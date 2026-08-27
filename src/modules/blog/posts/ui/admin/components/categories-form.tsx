"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { Form } from "@/shared/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";

import { useCategoriesQuery } from "@/modules/blog/categories/hooks/use-categories";
import { MultiSelectField } from "@/modules/blog/shared/components/multi-select-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { postUpdateSchema, type PostUpdateValues } from "../../../schemas";
import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { usePostStore } from "../../../store/use-post-store";

interface CategoriesFormProps {
  initialData: {
    postCategories: {
      category: {
        id: string;
        rootId: string | null;
        title: string;
        slug: string;
        status: string;
      };
      sort: number;
    }[];
  };
  rootId: string;
  postId: string;
}

export const CategoriesForm = ({
  initialData,
  rootId,
  postId,
}: CategoriesFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const { setStatus } = usePostStore();

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    defaultValues: {
      categories:
        initialData?.postCategories?.map((a) => ({
          id: a.category.id,
          sort: a.sort,
        })) ?? [],
    },
    mode: "onChange",
  });

  const {
    data: categories,
    isError: isCategoryError,
    isLoading,
  } = useCategoriesQuery();

  const { mutate: updatePost, isPending } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        setStatus("saved");
        toast.success("Post updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAutoSave = useAutoSave(
    form,
    (dirtyData) => {
      setStatus("saving");
      updatePost({
        ...dirtyData,
        id: postId,
        rootId: rootId,
        categories: dirtyData.categories ?? [],
      });
    },
    0,
  );

  const isLoadingSkeleton =
    isLoading && (!categories || categories.length === 0);

  if (isLoadingSkeleton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <Skeleton className="w-full h-10" />
        </CardContent>
      </Card>
    );
  }

  if (!categories || isCategoryError)
    return <div>Error loading categories...</div>;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form className="space-y-4">
            <MultiSelectField
              control={form.control}
              name="categories"
              disabled={isPending}
              options={
                categories
                  ? categories.map((c) => ({
                      id: c.id,
                      title: c.title,
                      status: c.status,
                    }))
                  : []
              }
              label="Categories"
              showLabel={false}
              isLoading={isLoading}
              onSelect={handleAutoSave}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
