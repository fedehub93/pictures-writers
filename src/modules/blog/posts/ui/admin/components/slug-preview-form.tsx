"use client";

import { Route } from "next";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EditableField } from "@/modules/blog/shared/components/editable-field";

import { usePostStore } from "../../../store/use-post-store";
import { usePostsFilters } from "../../../hooks/use-posts-filters";

interface SlugPreviewFormProps {
  initialData: {
    slug: string;
  };
  rootId: string;
  postId: string;
}

export const SlugPreviewForm = ({
  initialData,
  rootId,
  postId,
}: SlugPreviewFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const { setStatus } = usePostStore();

  const updatePost = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Impossibile aggiornare");
      },
    }),
  );

  const previewLink = `${process.env.NEXT_PUBLIC_APP_URL}/draft/${initialData.slug}`;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Slug & Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-x-1">
        <Link href={previewLink as Route} target="_blank" className="text-xs">
          {process.env.NEXT_PUBLIC_APP_URL}/
        </Link>
        <EditableField
          initialValue={initialData.slug}
          onSave={async (value) => {
            setStatus("saving");
            await updatePost.mutateAsync({
              id: postId,
              rootId,
              slug: value,
            });
            setStatus("saved");
          }}
          textClassName="!text-xs font-medium"
          placeholder="Post slug..."
          required
        />
      </CardContent>
    </Card>
  );
};
