"use client";

import { Route } from "next";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { EditableTextareaField } from "@/modules/blog/shared/components/editable-textarea-field";

import { usePostStore } from "../../../store/use-post-store";
import { usePostsFilters } from "../../../hooks/use-posts-filters";

interface DescriptionFormProps {
  initialData: {
    description: string | null;
  };
  rootId: string;
  postId: string;
}

export const DescriptionForm = ({
  initialData,
  rootId,
  postId,
}: DescriptionFormProps) => {
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

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Description
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-x-1">
        <EditableTextareaField
          initialValue={initialData.description ?? ""}
          onSave={async (value) => {
            setStatus("saving");
            await updatePost.mutateAsync({
              id: postId,
              rootId,
              description: value,
            });
            setStatus("saved");
          }}
          textClassName="!text-xs"
          placeholder="Post description..."
          required
        />
      </CardContent>
    </Card>
  );
};
