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

import { MultiSelectField } from "@/modules/blog/shared/components/multi-select-field";
import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { useTagsQuery } from "@/modules/blog/tags/hooks/use-tags";

import { postUpdateSchema, type PostUpdateValues } from "../../../schemas";
import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { usePostStore } from "../../../store/use-post-store";

interface TagsFormProps {
  initialData: {
    tags: {
      id: string;
    }[];
  };
  rootId: string;
  postId: string;
}

export const TagsForm = ({ initialData, rootId, postId }: TagsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const { setStatus } = usePostStore();

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    values: {
      tags: initialData.tags
        ? [
            ...initialData.tags.map((t) => ({
              id: t.id,
            })),
          ]
        : [],
    },
    mode: "onChange",
  });

  const { data: tags, isError: isTagError, isLoading } = useTagsQuery();

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
        tags: dirtyData.tags ?? [],
      });
    },
    0,
  );

  const isLoadingSkeleton = isLoading && (!tags || tags.length === 0);

  if (isLoadingSkeleton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <Skeleton className="w-full h-10" />
        </CardContent>
      </Card>
    );
  }

  if (!tags || isTagError) return <div>Error loading tags...</div>;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex justify-between">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form className="space-y-4">
            <MultiSelectField
              control={form.control}
              name="tags"
              disabled={isPending}
              options={
                tags
                  ? tags.map((c) => ({
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
